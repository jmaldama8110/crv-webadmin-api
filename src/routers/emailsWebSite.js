const express = require('express');
const router = new express.Router();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const moment = require('moment');
moment.locale('en');

router.post('/sendEmailHelp', async(req, res) => {
    try{

        const data =  req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');
        // console.log(data);

        let subjectOption = '';
        let titleOption = '';
        let txtOption = '';
        let pOption = '';

        if(parseInt(data.option) === 1){
            subjectOption = 'Nuevo comentario';
            titleOption = 'Nuevo comentario recibido';
            txtOption = 'Se ha recibido un nuevo comentario';
            pOption = 'Con el siguiente comentario:'
        }
        if(parseInt(data.option) === 2){
            subjectOption = 'Nueva solicitud de ayuda';
            titleOption = 'Nueva solicitud de ayuda recibida';
            txtOption = 'Se ha recibido una solicitud de ayuda';
            pOption = 'Con el siguiente comentario:'
        }
        if(parseInt(data.option) === 3){
            subjectOption = 'Nuevo queja';
            titleOption = 'Nueva queja recibida';
            txtOption = 'Se ha recibido una nueva queja';
            pOption = 'Con la siguiente queja:'
        }

        // <h2><b>Alerta CSV - ${titleOption}</b></h2><p/>

        console.log(hora.toLowerCase())

        const text = `
                        <h4> <b>${txtOption} con folio #1000</b><p/></h4>

                        Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                        Nombre: ${data.name} <br/>
                        Email: ${data.email} <br/>
                        Teléfono: ${data.phone} <p/>

                        <h4><strong>${pOption}</strong><br/></h4>
                        ${data.comment}
                        
                    
                    `;

        sgMail.send({
            to: 'callcenter@grupoconserva.mx',
            // to: 'solorzanojluis01@gmail.com',
            from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
            subject: `Alerta CSV - ${titleOption}`,
            html: text
        });

        res.status(201).send('Correo enviado!');

    } catch(err){
        console.log(err);
        res.status(400).send(err)
    }
});


router.post('/sendEmailComplaint', async(req, res) => {
    try{

        const data =  req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');
        // console.log(data)
        // const hoy = new Date();
        const anonimo = data.checked ? 'Sí' : 'No';

        const text = `
                        <h4> <b>Se ha recibido una nueva denuncia con folio #1000</b><p/></h4>

                        Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                        Nombre: ${data.name} <br/>
                        Email: ${data.email} <br/>
                        Teléfono: ${data.phone} <br/>
                        <b>*Desea que su denuncia sea anónima: ${anonimo}</b><br/>

                        <h4><strong>Con la siguiente denuncia:</strong></h4>
                        ${data.comment}
                        
                    
                    `;

        const correos = [
            {
                email: 'mmendoza@grupoconserva.mx'
            },
            {
                email: 'rgordillo@grupoconserva.mx'
            }
        ]

        for( let i=0 ; i<correos.length ; i++){
            const e = correos[i];

            sgMail.send({
                to: e.email,
                from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
                subject: `Alerta CSV - Nueva denuncia recibida`,
                html: text
            });
        }

        // res.status(201).send(data);
        res.status(201).send('Correo enviado!');

    } catch(err){
        console.log(err);
        res.status(400).send(err)
    }
});

router.post('/sendEmailRecruitment', async(req, res) => {
    try{

        const data =  req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');
        // const hoy = new Date();
        console.log(data);

        const text = `
                        <h4> <b>Se ha recibido una nueva Solicitud de empleo con folio #1000</b><p/></h4>

                        Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                        Nombre: ${data.name} <br/>
                        Email: ${data.email} <br/>
                        Teléfono: ${data.phone} <br/>
                        Area de interés: ${data.area} <br/>
                        Edad: ${data.age} <br/>
                        Estado: ${data.province} <br/>
                        Sexo: ${data.sex} <br/>

                        <h4><strong>Motivacion para trabajar con Conserva:</strong></h4>
                        ${data.comment}
                        
                    
                    `;

        sgMail.send({
            to: 'klsalazar@grupoconserva.mx',
            from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
            subject: `Alerta CSV - Solicitud de empleo recibida`,
            html: text,
            attachments: [
                {
                  content: data.cv,
                  filename: data.fileName,
                  type: data.fileType,
                  disposition: "attachment"
                }
            ]
        });

        // res.status(201).send(data);
        res.status(201).send('Correo enviado!');

    } catch(err){
        console.log(err);
        res.status(400).send(err)
    }
});


module.exports = router;