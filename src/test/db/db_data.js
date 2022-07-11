const {TNC_logo, CTA_logo, MDP_logo} = require('./base64_images');
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Signup = require('../../model/signup');
const Employee = require('../../model/employee');
const Client = require('../../model/client');
const User = require('../../model/user');
const Product = require('../../model/product');

const conservaId = mongoose.Types.ObjectId()

const conserva = {
    _id: conservaId,
    name: "CONSERVA",
    lastname: "N/A",
    second_lastname: "N/A",
    email: 'conserva@gmail.com',
    dob: "2000-10-01T00:00:00.000Z"
}

const userConserva = {
    name: "CONSERVA",
    lastname: "N/A",
    second_lastname: "N/A",
    email: 'conserva@gmail.com',
    password: '123456',
    employee_id: conservaId
};

//Datos para los empleados
const employee01Id = mongoose.Types.ObjectId()
const employee01 = {
    _id: employee01Id,
    name: "JOSE LUIS",
    lastname: "SOLORZANO",
    second_lastname: "LOPEZ",
    email: 'jluis@gmail.com',
    password: "123456",
    dob: "2000-10-01T00:00:00.000Z"
}

const employee02 = {
    name: "KEVIN EDUARDO",
    lastname: "MAZARIEGOS",
    second_lastname: "GOMEZ",
    password: "123456",
    dob: "1998-05-12T00:00:00.000Z"
}

const employee03 = {
    name: "OMAR",
    lastname: "MELENDEZ",
    second_lastname: "DIAZ",
    email: 'omar@gmail.com',
    password: "123456",
    dob: "2000-05-04T00:00:00.000Z"
}

//Datos para los clientes
const client01 = {
    deleted: false,
    name: "JAVIER",
    lastname: "HERNANDEZ",
    second_lastname: "HERNANDEZ",
    email: "javier@gmail.com",
    ine_folio: "",
    dob: "2012-12-12T06:00:00.000Z",
    segmento: "0",
    loan_cycle: 0,
    client_type: "Persona Fisica",
    branch : "",
    sex: "Masculino",
    education_level: "Universidad",
    address: [
        {
            address_type: "Casa",
            country: "México",
            province: "Chiapas",
            municipality: "Rayón",
            locality: "Rayón",
            settlement: "Rayón, Chiapas",
            ownership_type: "Vivienda",
            residence_since: "5 años",
            address_line1: "AV CENTRAL PNTE S/N",
            address_line2: "Barrio San Bartolo",
            street_reference: "Entre primera sur poniente y central poniente"
        }
    ],
    phones: [{
        phone: "9191475689",
        phone_type: "Movile",
        phone_propierty: true
    }],
    credit_circuit_data: [],
    external_id: "",
    tributary_regime: "",
    rfc: "SAT123456",
    nationality: "Mexicana",
    province_of_birth: "Chiapas",
    country_of_birth: "México",
    ocupation: "Carpintero",
    marital_status: "Casado(a)",
    identification_type: "INE",
    guarantor: [
        {
            name: "JUAN",
            lastname: "DOMINGUEZ",
            second_lastname: "ALVAREZ",
            dob: "2000-10-01T00:00:00.000Z",
            sex: "Masculino",
            nationality: "Mexicana",
            province_of_birth: "Chiapas",
            country_of_birth: "México",
            rfc: "SAT568974",
            curp: "CURP45781",
            ocupation: "Plomero",
            e_signature: "N/A",
            marital_status: "Casado(a)",
            phones: [{
                phone: "9191475689",
                phone_type: "Movile",
                phone_propierty: true
            }],
            email: "juan@gmail.com",
            identification_type: "INE",
            identification_number: "00000",
            company_works_at: "Plomería",
            address: [
                {
                    address_type: "Casa",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Vivienda",
                    residence_since: "5 años",
                    address_line1: "AV CENTRAL PNTE S/N",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ],
            person_resides_in: "Familia"
        }
    ],
    business_data: [
        {
            business_name: "Materiales el Constructor",
            economic_activity: "Venta de materiales de construcción",
            sector: "Construcción",
            business_since: "3 años",
            store_type: "",
            previous_business_activity: "Venta de planos arquitectónicos",
            address: [
                {
                    address_type: "Negocio",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Local",
                    residence_since: "3 años",
                    address_line1: "Tercera Poniente Sur",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ],
        }
    ],
    beneficiaries: [
        {
            name: "FABIOLA",
            lastname: "MARTINEZ",
            second_lastname: "ALVAREZ",
            dob: "1998-10-01T00:00:00.000Z",
            relationship: "Esposa",
            percentage: "100%",
            phones: [{
                phone: "9615648974",
                phone_type: "Movile",
                phone_propierty: true
            }],
            address: [
                {
                    address_type: "Casa",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Vivienda",
                    residence_since: "5 años",
                    address_line1: "AV CENTRAL PNTE S/N",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ]
        }
    ],
    personal_references: [
        {
            name: "DAVID",
            lastname: "GOMEZ",
            second_lastname: "GONZALEZ",
            dob: "1998-10-01T00:00:00.000Z",
            relationship: "Padre",
            phones: [{
                phone: "9615648974",
                phone_type: "Movile"
            }],
            address: [
                {
                    address_type: "Casa",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Vivienda",
                    residence_since: "5 años",
                    address_line1: "AV CENTRAL PNTE S/N",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ]
        }
    ],
    guarantee:[
        {
            description: "Refigerador Mabe",
            guarantee_type: "",
            value: "7000",
            percentage: "35%",
            expiration_date: "2022-10-01T00:00:00.000Z"
        },
        {
            guarantee_type: "",
            description: "Televisión LG",
            value: "3000",
            percentage: "15%",
            expiration_date: "2022-10-01T00:00:00.000Z"
        },
        {
            guarantee_type: "",
            description: "Laptop HP",
            value: "12000",
            percentage: "60%",
            expiration_date: "2022-10-01T00:00:00.000Z"
        },
    ]
}

const client02 = {
    deleted: false,
    // name: "VICTOR LUIS",
    // lastname: "DIAZ",
    second_lastname: "DIAZ",
    email: "victor@gmail.com",
    ine_folio: "",
    dob: "2012-12-12T06:00:00.000Z",
    segmento: "0",
    loan_cycle: 0,
    client_type: "Persona Fisica",
    branch : "",
    sex: "Masculino",
    education_level: "Universidad",
    address: [
        {
            address_type: "Casa",
            country: "México",
            province: "Chiapas",
            municipality: "Rayón",
            locality: "Rayón",
            settlement: "Rayón, Chiapas",
            ownership_type: "Vivienda",
            residence_since: "5 años",
            address_line1: "Colonia",
            address_line2: "Guayabal",
            street_reference: "Entre primera sur poniente y central poniente"
        }
    ],
    phones: [{
        phone: "9191475689",
        phone_type: "Movile",
        phone_propierty: true
    }],
    credit_circuit_data: [],
    external_id: "",
    tributary_regime: "",
    rfc: "SAT123456",
    nationality: "Mexicana",
    province_of_birth: "Chiapas",
    country_of_birth: "México",
    ocupation: "Carpintero",
    marital_status: "Casado(a)",
    identification_type: "INE",
    guarantor: [
        {
            name: "JUAN",
            lastname: "DOMINGUEZ",
            second_lastname: "ALVAREZ",
            dob: "2000-10-01T00:00:00.000Z",
            sex: "Masculino",
            nationality: "Mexicana",
            province_of_birth: "Chiapas",
            country_of_birth: "México",
            rfc: "SAT568974",
            curp: "CURP45781",
            ocupation: "Plomero",
            e_signature: "N/A",
            marital_status: "Casado(a)",
            phones: [{
                phone: "9191475689",
                phone_type: "Movile",
                phone_propierty: true
            }],
            email: "juan@gmail.com",
            identification_type: "INE",
            identification_number: "00000",
            company_works_at: "Plomería",
            address: [
                {
                    address_type: "Casa",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Vivienda",
                    residence_since: "5 años",
                    address_line1: "AV CENTRAL PNTE S/N",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ],
            person_resides_in: "Familia"
        }
    ]
}

const personalReferences_update = {
    personal_references: [
        {
            name: "MARCOS",
            lastname: "HERNANDEZ",
            second_lastname: "SANCHEZ",
            dob: "1980-10-01T00:00:00.000Z",
            relationship: "Padre",
            phones: [{
                phone: "9615648974",
                phone_type: "Movile"
            }],
            address: [
                {
                    address_type: "Casa",
                    country: "México",
                    province: "Chiapas",
                    municipality: "Rayón",
                    locality: "Rayón",
                    settlement: "Rayón, Chiapas",
                    ownership_type: "Vivienda",
                    residence_since: "5 años",
                    address_line1: "AV CENTRAL PNTE S/N",
                    address_line2: "Barrio San Bartolo",
                    street_reference: "Entre primera sur poniente y central poniente"
                }
            ]
        }
    ]
}

//Datos para los productos
const product01 = {
    deleted: false,
    product_type: "TNC",
    product_name: "Tu negocio con conserva",
    step_amount: "00.00",
    min_amount: "30000",
    max_amount: "150000",
    default_amount: "00.00",
    min_term: 2,
    max_term: 12,
    default_term: ["6","M"],
    allowed_frequency: [
        {identifier: "Sl", value:"Semanal"},
        {identifier: "Ml", value:"Mensual"}
    ],
    allowed_term_type: [
        {identifier: "M", value: "Mes(es)", year_periods:"12"},
        {identifier: "B",value: "Bimestre(s)", year_periods:"6"}
    ],
    year_days: 360,
    rate: "60.00",
    loan_purpose: [
        {external_id:"1", description:"remodelacion de negocio"},
        {external_id:"2", description:"techado de casa habitacion"},
        {external_id:"3", description:"compra de materiales de obra"}
    ],
    logo: TNC_logo,
    avatar: TNC_logo,
    default_mobile_product: false,
    enabled: true
}

const product02 = {
    deleted: false,
    product_type: "CTA",
    product_name: "Conserva te activa",
    step_amount: "00.00",
    min_amount: "30000",
    max_amount: "150000",
    default_amount: "00.00",
    min_term: 2,
    max_term: 12,
    default_term: ["6","M"],
    allowed_frequency: [
        {identifier: "Sl", value:"Semanal"},
        {identifier: "Ml", value:"Mensual"}
    ],
    allowed_term_type: [
        {identifier: "M", value: "Mes(es)", year_periods:"12"},
        {identifier: "B",value: "Bimestre(s)", year_periods:"6"}
    ],
    year_days: 360,
    rate: "60.00",
    loan_purpose: [
        {external_id:"1", description:"remodelacion de negocio"},
        {external_id:"2", description:"techado de casa habitacion"},
        {external_id:"3", description:"compra de materiales de obra"}
    ],
    logo: CTA_logo,
    avatar: CTA_logo,
    default_mobile_product: false,
    enabled: true
}

const product03 = {
    // deleted: false,
    // product_type: "CTA",
    // product_name: "Conserva te activa",
    // step_amount: "00.00",
    min_amount: "30000",
    max_amount: "150000",
    default_amount: "00.00",
    min_term: 2,
    max_term: 12,
    default_term: ["6","M"],
    allowed_frequency: [
        {identifier: "Sl", value:"Semanal"},
        {identifier: "Ml", value:"Mensual"}
    ],
    allowed_term_type: [
        {identifier: "M", value: "Mes(es)", year_periods:"12"},
        {identifier: "B",value: "Bimestre(s)", year_periods:"6"}
    ],
    year_days: 360,
    rate: "60.00",
    loan_purpose: [
        {external_id:"1", description:"remodelacion de negocio"},
        {external_id:"2", description:"techado de casa habitacion"},
        {external_id:"3", description:"compra de materiales de obra"}
    ],
    logo: CTA_logo,
    avatar: CTA_logo,
    default_mobile_product: false,
    enabled: true
}

const product01_update = {
    product_type: "MDP",
    product_name: "Mujeres de Palabra",
    logo: MDP_logo
}

const initDB = async() => {
    await Signup.deleteMany()
    await User.deleteMany()
    await Employee.deleteMany()
    await Client.deleteMany()
    await Product.deleteMany()
    await new Employee(conserva).save()
    userConserva.password = await User.passwordHashing(userConserva.password)
    await new User(userConserva).save()
}

module.exports = {
    conserva,
    userConserva,
    initDB,
    employee01Id,
    employee01,
    employee02,
    employee03,
    client01,
    client02,
    personalReferences_update,
    product01,
    product02,
    product03,
    product01_update
}

