const express = require('express');
const router = new express.Router();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const moment = require('moment');
moment.locale('en');


router.post('/subscribe', async(req, res) => {
    try{

        const data =  req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');

        // console.log(data);

        const text = `
                        <h3> <b>Se ha recibido un nuevo suscriptor para el boletín de noticias</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                            Email: ${data.email} <br/>
                        </h4>
                    `;

        sgMail.send({
            to: 'callcenter@grupoconserva.mx',
            // to: 'solorzanojluis01@gmail.com',
            from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
            subject: 'Alerta CSV - Nuevo suscriptor',
            html: text
        });

        res.status(201).send('Correo enviado!');

    } catch(err){
        console.log(err);
        res.status(400).send(err);
    }

});

router.post('/sendEmailHelp', async(req, res) => {
    try{

        const data =  req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');
        const clienta = data.checked ? 'Sí' : 'No';

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
            subjectOption = 'Nueva queja';
            titleOption = 'Nueva queja recibida';
            txtOption = 'Se ha recibido una nueva queja';
            pOption = 'Con la siguiente queja:'
        }

        if(!data.email || data.email === undefined){
            data.email = 'No se cuenta con una dirección de correo electrónico';
        }

        // <h2><b>Alerta CSV - ${titleOption}</b></h2><p/>

        // console.log(hora.toLowerCase())

        let text;

        if(data.checked){

            if(!data.promotor || data.promotor === undefined){
                data.promotor = 'No se cuenta con esta información'
            }

            text = `
                        <h3> <b>${txtOption} con folio #1000</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                            Nombre: ${data.name} <br/>
                            Email: ${data.email} <br/>
                            Teléfono: ${data.phone} <p/>
                            Clienta de Conserva: ${clienta} <br/>
                            Sucursal: ${data.branch} <br/>
                            Promotor: ${data.promotor} <br/>
                            Estado de la república: ${data.province} <br/>
                            Cuidad o Municipio: ${data.city} <p/>
                        </h4>

                        <h3><strong>${pOption}</strong><br/></h3>
                        <h4>${data.comment}</h4>
                    `;

        } else{
            text = `
                        <h3> <b>${txtOption} con folio #1000</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                            Nombre: ${data.name} <br/>
                            Email: ${data.email} <br/>
                            Teléfono: ${data.phone} <p/>
                            Clienta de Conserva: ${clienta} <p/>

                        </h4>

                        <h3><strong>${pOption}</strong><br/></h3>
                        <h4>${data.comment}</h4>

                        
                    `;
        }

        // console.log(text);

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
        const anonimo = data.checked ? 'Sí' : 'No';

        const text = `
                        <h3> <b>Se ha recibido una nueva denuncia con folio #1000</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                            Nombre: ${data.name} <br/>
                            Email: ${data.email} <br/>
                            Teléfono: ${data.phone} <br/>
                            <b>*Desea que su denuncia sea anónima: ${anonimo}</b><p/>
                        </h4>

                        <h3><strong>Con la siguiente denuncia:</strong></h3>
                        <h4>${data.comment}</h4>
                    `;

        const correos = [
            {
                email: 'mmendoza@grupoconserva.mx'
                // email: 'solorzanojluis01@gmail.com',
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

        const text = `
                        <h3> <b>Se ha recibido una nueva Solicitud de empleo con folio #1000</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<br/>
                            Nombre: ${data.name} <br/>
                            Email: ${data.email} <br/>
                            Teléfono: ${data.phone} <br/>
                            Area de interés: ${data.area} <br/>
                            Puesto solicitado: ${data.position} <br/>
                            Edad: ${data.age} <br/>
                            Estado: ${data.province} <br/>
                            Sexo: ${data.sex} <p/>
                        </h4>

                        <h3><strong>Motivacion para trabajar con Conserva:</strong></h3>
                        <h4>${data.comment}</h4>
                    `;

        sgMail.send({
            to: 'klsalazar@grupoconserva.mx',
            // to: 'solorzanojluis01@gmail.com',
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


router.post('/loan', async(req, res) => {
    try{

        const data = req.body;
        const hoy = moment().format('L');
        const hora = moment().format('LT');

        const text = `
                        <h3> <b>Se ha recibido una nueva Solicitud de empleo</b><p/></h3>

                        <h4>
                            Fecha de recepción: ${hoy} a las ${hora.toLowerCase()}<p/>

                            Datos Personales <br/>
                            Nombre: ${data.name} ${data.lastname} <br/>
                            Estado: ${data.state} <br/>
                            Municipio: ${data.country} <br/>
                            Fecha de Nacimiento: ${data.birthday} <br/>
                            Teléfono: ${data.phone} <br/>
                            Teléfono Alterno: ${data.phoneAlternative} <p/>

                            Datos del Negocio <br/>
                            Giro al que pertenece: ${data.turn} <br/>
                            Ubicación: ${data.ubication} <br/>
                            Monto Solicitado: ${data.amount} <p/>

                            Duración del negocio <br/>
                            Años: ${data.bussineYear} año(s)<br/>
                            Meses: ${data.bussineMoth} mes(es)<br/>
                            Tipo de negocio: ${data.bussineType} <p/>

                            Contacto <br/>
                            Día disponible para contactar: ${data.day} <br/>
                            Con horario de: ${data.timeFrom} hrs a ${data.timeTo} hrs<br/>
                        </h4>

                        <h3><strong>Comentarios:</strong></h3>
                        <h4>${data.comment}</h4>
                    `;

        sgMail.send({
            to: 'callcenter@grupoconserva.mx',
            // to: 'solorzanojluis01@gmail.com',
            from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
            subject: 'Alerta CSV - Solicitud de crédito recibida',
            html: text
        });

        // res.status(201).send(data);
        res.status(201).send('Correo enviado!');

    } catch(err){
        res.status(400).send(err);
    }
});


module.exports = router;