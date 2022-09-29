const express = require('express');
const router =  new express.Router();
const auth = require('../middleware/auth');
const Contract = require('../model/contract');
const Loan = require('../model/loanapp');

const docusign = require('docusign-esign');
const fs = require('fs');
const axios = require('axios');
const dsConfig = require('../utils/dsConfig').config;
const apiClient = new docusign.ApiClient();

apiClient.setBasePath('https://demo.docusign.net/restapi');
apiClient.setOAuthBasePath('account-d.docusign.com');
const dsUserID = process.env.DOCUSIGN_USER_ID;
const dsClientId = process.env.DOCUSIGN_INTEGRATION_KEY;

const rsaKey = fs.readFileSync('./config/privateKey.txt');
const jwtLifeSec = 10 * 60;

apiClient.requestJWTUserToken(dsClientId, dsUserID, 'signature', rsaKey, jwtLifeSec)
    .then((results) => {
        dsConfig.dsAccessToken = results.body.access_token;
        console.log('DucuSing SignIn...');
        apiClient.addDefaultHeader('Authorization', `Bearer ${dsConfig.dsAccessToken}`);

        let envelopeApi = new docusign.EnvelopesApi(apiClient);
        let env = new docusign.Envelope();
        env.status = 'voided';
        env.voidedReason = 'Declined Offter';

        apiClient.getUserInfo(dsConfig.dsAccessToken)
            .then((result) => {
                dsConfig.dsAccountId = result.accounts[0].accountId;
                console.log('User information saved 👌');
            }).catch((error) => { console.log(error); });
    });

router.post('/contracts', auth, async(req, res) => {
    try{

        const data = req.body;
        const { users, documents, client_id, loan_id } = data;

        let envelopeApi = new docusign.EnvelopesApi(apiClient);

        const envDefn = {
            documents:
                documents.map((doc, idx) => {
                    const docObj = {
                        documentBase64: doc.base64,
                        documentId: `${idx + 1}`,
                        fileExtension: doc.fileExtension,
                        name: doc.name
                    }

                    return docObj;
                }),
            emailSubject: 'Prueba de envio de Contrato CNSRV',
            recipients: {
                signers: 
                users.map((user, idx) => {
                    const userObj = {
                        email: user.email,
                        name: user.name,
                        recipientId: `${idx + 1}`,
                        tabs: {
                            signHereTabs:
                                idx != 1 ?
                                    [
                                        {
                                            documentId: "1",
                                            name: "RECIPIENT 1 SIGN 1",
                                            // optional: "false",
                                            pageNumber: "13",
                                            recipientId: "1",
                                            scaleValue: 1,
                                            tabLabel: "signer1_doc2",
                                            xPosition: "368",
                                            yPosition: "545"
                                        },
                                        {
                                            documentId: "2",
                                            name: "RECIPIENT 1 SIGN 2",
                                            // optional: "false",
                                            pageNumber: "1",
                                            recipientId: "1",
                                            scaleValue: 1,
                                            tabLabel: "signer1_doc2",
                                            xPosition: "250",
                                            yPosition: "335"
                                        },
                                        {
                                            documentId: "3",
                                            name: "RECIPIENT 1 SIGN 3",
                                            // optional: "false",
                                            pageNumber: "2",
                                            recipientId: "1",
                                            scaleValue: 1,
                                            tabLabel: "signer1_doc2",
                                            xPosition: "240",
                                            yPosition: "293"
                                        }

                                    ] :
                                    [
                                        {
                                            documentId: "1",
                                            name: "RECIPIENT 2 SIGN 1",
                                            pageNumber: "13",
                                            recipientId: "2",
                                            scaleValue: 1,
                                            tabLabel: "signer1_doc2",
                                            xPosition: "100",
                                            yPosition: "545"
                                        },
                                        {
                                            documentId: "2",
                                            name: "RECIPIENT 2 SIGN 2",
                                            // optional: "false",
                                            pageNumber: "1",
                                            recipientId: "2",
                                            scaleValue: 1,
                                            tabLabel: "signer1_doc2",
                                            xPosition: "220",
                                            yPosition: "330"
                                        }
                                    ]
                        }
                    }

                    return userObj;
                })
            },
            status: 'sent'
        }

        const optsEnvelope = {
            cdseMode: '',
            changeRoutingOrder: 'true',
            completedDocumentsOnly: 'false',
            mergeRolesOnDraft: '',
            tabLabelExactMatches: '',
            envelopeDefinition: envDefn
        }

        envelopeApi.createEnvelope(dsConfig.dsAccountId, optsEnvelope)
            .then(async(result) => {

                // res.status(200).send(result);
                const data = {
                    data_representative: users[1],
                    data_client : users[0],
                    documents,
                    docusign_uri: result.uri,
                    status: result.status,
                    client_id,
                    loan_id
                }
        
                const contract = new Contract({...data});
                await contract.save();
        
                res.status(201).send(contract);
                
            }).catch((err) => {
                console.log(err)
                res.status(400).send(err)
            })

    } catch(err){
        res.send(err.message);
    }
});

router.get('/contracts', auth, async(req, res) => {
    try{
        const match = {};

        if(req.query.id){
            match._id = req.query.id
        }

        const contract = await Contract.find(match);
        if(!contract){
            return res.status(204).send('Not records found');
        }

        for(let i = 0; i < contract.length; i++){
            const c = contract[i];

            await c.populate('client_id', {name:1, lastname:1, second_lastname:1}).execPopulate();
            await c.populate('loan_id', {product:1, apply_amount:1, id_loan:1, id_contract:1}).execPopulate();
            await c.loan_id.populate('product', {product_name:1}).execPopulate();
        }

        res.status(200).send(contract);

    } catch(err){
        res.send(err.message);
    }
});

router.get('/idContractHF', auth, async(req, res) => {
    try{
        const id_loan = req.query.id_loan;

        if(!id_loan) {
            throw new Error('The parameter id_loan is required');
        }

        const loan = await Loan.findOne({id_loan});

        const result = await Contract.getIdContrato(id_loan);

        if(!result || result.length === 0) {
            return res.status(204).send({message: 'Esta solicitud aún no tiene un contrato'})
        }

        if(result && loan) {
            // console.log('Tiene loan y contrato');
            loan['id_contract'] = result[0].id;
            await loan.save();
        }

        res.status(200).send(result);

    } catch(err){
        res.status(400).send(err.message);
    }
});

router.get('/apoderados', auth, async(req, res) => {
    try{

        const id_contrato = req.query.id_contrato;
        if(!id_contrato){
            throw new Error('The parameter id_contrato is required')
        }

        const result = await Contract.getRepresentanteLegal(id_contrato);
        if(!result || result.length === 0){
            throw new Error('No data could be found');
        }

        res.status(200).send(result)

    } catch(err){
        res.status(400).send(err.message);
    }
});

router.get('/poderNotarial', auth, async(req, res) =>{//Peticion anterior para obtener apoderados
    try{
        const idLoan = req.query.idLoan;
        const idOffice = req.query.idOffice;

        if(!idLoan || !idOffice){
            throw new Error('It is required to provide the parameters idLoan and idOffice')
        }

        const result = await Contract.getPoderNotarialByOfficeYFondo(idLoan, idOffice);
        console.log(result.length);

        res.status(200).send(result);

    } catch (e){
        console.log(e);
        res.status(404).send(e.message);
    }
});

router.patch('/contracts', auth, async(req, res) => {
    try{

    } catch(err){
        res.send(err.message);
    }
});

router.delete('/contracts', auth, async(req, res) => {
    try{

    } catch(err){
        res.send(err.message);
    }
});

module.exports = router;