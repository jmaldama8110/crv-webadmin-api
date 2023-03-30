const express = require('express');
const router = new express.Router();
const authorize = require('../middleware/authorize');
const Group = require('../model/group');
const nano = require('../db/connCouch');

router.get('/clients/hf/search', authorize, async(req, res) => {
    
    try{

        if( !(req.query.branchId && req.query.clientName) ){
            throw new Error('Query parametrs branchId or clientName are missing!')
        }
        const data = await Group.searchGroupLoanByName(req.query.clientName,parseInt(req.query.branchId));
        res.status(200).send(data);

    } catch(err){
        console.log(err);
        res.status(400).send(err);
    }
})

router.get('/groups/hf/loanapps', authorize, async(req, res) => {
    try{

        if( !(req.query.branchId && req.query.applicationId) ){
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data = await Group.getLoanApplicationById(parseInt(req.query.applicationId),parseInt(req.query.branchId));
        /**
         * resultsets[0] => Detalle de la solicitud
         * resultsets[1] => Ciclo y estatus 
         * resultsets[2] => Nombre del grupo, dia / hora reunion
         * resultsets[3] => Direccion del grupo
         * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
         * resultsets[5] => Integrantes / Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
         */ 
        const loan_application = data[0][0];
        const loan_cycle = data[1][0];
        const group_info = data[2][0];
        const group_address = data[3][0];
        
        const group_data = {
            
            id_cliente: group_info.id_cliente,
            group_name: group_info.nombre,
            weekday_meet: group_info.reunion_dia.trim(),
            hour_meet: group_info.reunion_hora.trim(),
            branch: group_info.id_oficina,
            loan_officer: loan_application.id_oficial,
            loan_cycle: loan_cycle.ciclo,
            address: {
              post_code: '',
              address_line1: group_address.direccion,
              road_type: [group_address.vialidad,''],
              province: [`PROVINCE|${group_address.estado}`,''],
              municipality: [`MUNICIPALITY|${group_address.municipio}`,''],
              city: [`CITY|${group_address.localidad}`,''],
              colony: [`NEIGHBORHOOD|${group_address.colonia}`,''],
              address_line2:group_address.referencia,       
              numero_exterior: group_address.numero_exterior,
              numero_interior: group_address.numero_interior
            }
             
        }
        
        const members = data[4].map( (i,nCounter) =>{
                const insuranceMemberInfo = data[5].find( (x)=> x.id_individual === i.id_individual);
                ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
                return {
                    _id: `${Date.now() + nCounter}`,
                    id_member: i.id,
                    id_cliente: i.id_individual,
                    fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
                    estatus: i.estatus.trim(),
                    sub_estatus: i.sub_estatus.trim(),
                    position: i.cargo.trim(),
                    apply_amount: i.monto_solicitado,
                    approved_amount: i.monto_autorizado,
                    previous_amount: i.monto_anterior,
                    loan_cycle: i.ciclo,
                    disbursment_mean: i.id_cata_medio_desembolso,
                    insurance: {
                        beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                        relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                        percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0 )
                    }
                    
                }
            })

        /// retrieves Product information, that is not provided by HF
        const db = nano.use(process.env.COUCHDB_NAME);

        await db.createIndex({ index:{  fields:["couchdb_type"] }});
        const productList = await db.find( { selector: { couchdb_type: "PRODUCT" }});
        const productMaster = productList.docs.find( (prod)=> prod.external_id == loan_application.id_producto_maestro  )
        
        const identifierFreq = loan_application.periodicidad.slice(0,1);
        const frequency = productMaster.allowed_term_type.find( (i) => i.identifier === identifierFreq)
        /// Uses the same loan application info, except some field, ei: id_solicitud,

        const loan_app = {
            id_cliente: loan_application.id_cliente,
            id_solicitud: loan_application.id, // uses the same Id of the previous one
            loan_officer: loan_application.id_oficial,
            branch: loan_application.id_oficina,
            id_producto: loan_application.id_producto,
            id_disposicion: loan_application.id_disposicion,
            apply_amount: loan_application.monto_total_solicitado,
            approved_total: loan_application.monto_total_autorizado,
            term: loan_application.plazo,
            frequency: [frequency.identifier,frequency.value],
            first_repay_date: loan_application.fecha_primer_pago,
            disbursment_date: loan_application.fecha_entrega,
            disbursment_mean: loan_application.medio_desembolso.trim(),
            liquid_guarantee: loan_application.garantia_liquida,
            loan_cycle: loan_cycle.ciclo,
            estatus: loan_application.estatus.trim(), // para renovacion
            sub_estatus: loan_application.sub_estatus.trim(), /// 
            members,
            product: {
              external_id: productMaster.external_id,
              min_amount: productMaster.min_amount,
              max_amount: (productMaster.max_amount)*(members.length),
              step_amount: productMaster.step_amount,
              min_term: productMaster.min_term,
              max_term: productMaster.max_term,
              product_name: productMaster.product_name,
              term_types: productMaster.allowed_term_type,
              rate: productMaster.rate,
              tax: productMaster.tax,
              GL_financeable: false,
              liquid_guarantee: loan_application.garantia_liquida
            }
        }

        res.status(200).send( { group_data, loan_app}  );
        

    } catch(err){
        console.log(err);
        res.status(400).send(err);
    }
})

module.exports = router;