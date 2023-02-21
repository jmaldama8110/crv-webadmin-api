
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendConfirmationEmail = (email, name, code) => {

    sgMail.send({
        to: email,
        from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
        subject: `${name} confirma tu correo!`,
        text: `Para poder confirmar tu cuenta, debes ingresar este código: ${code}`
    })

}

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
        subject: `${name} Bienvenido a tu servicios en linea!`,
        text: `Muchas gracias, tu correo ha sido confirmado!`
    })

}

const sendRecoverPasswordEmail = (email, name, code) => {

    sgMail.send({
        to: email,
        from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
        subject: 'Recuperación de contraseña',
        text: `Hola ${name}, recibimos tu solicitud de recuperación de contraseña, para ayudarte a restablecer tu contraseña y recuperar el acceso a la cuenta, debes ingresar el siguiente código ${code}`
    })
}

const sendGoodbyEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
        subject: `${name} lamentamos que tengas que darte de baja`,
        text: `Hola ${name} vamos a extrañarte!, haznos saber por este medio en que podemos mejorar para brindarte un mejor servicio... nos encatará leerte y conocer tu opinion..  Esperamos verte pronto de nuevo!!`
    })

}

const sendPaymentInformationLoanHF = (email, loan_id) => {

    sgMail.send({
        to: email,
        from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
        subject: `Información de pago`,
        text: `Información de pago de la solicitud ${loan_id}`
    })

}

const sendReportActionError = (data) => {
    try {
        sgMail.send({
            to: data.created_by,
            from: 'Servicio de Atención a Clientes<contacto@grupoconserva.mx>',
            subject: `Error Action`,
            text: `El Action ${data._id} con nombre ${data.name} reporto un error`
        })
    } catch (error) {
        console.log(error.message)
    }

}

module.exports = {
    sendConfirmationEmail,
    sendWelcomeEmail,
    sendRecoverPasswordEmail,
    sendGoodbyEmail,
    sendPaymentInformationLoanHF,
    sendReportActionError
}