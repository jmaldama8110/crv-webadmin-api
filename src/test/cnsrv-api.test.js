const request = require('supertest');
const app = require('../app');
const Signup = require('../model/signup');
const Employee = require('../model/employee');
const Client = require('../model/client');
const User = require('../model/user');
const Product = require('../model/product');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { initDB, conserva, userConserva, employee01Id, employee01, employee02, employee03, client01, client02, personalReferences_update, product01, product02, product03, product01_update} = require('./db/DB_Data');
const {TNC_logo, CTA_logo, MDP_logo} = require('./db/base64_images');

// beforeAll( async() => {
//     initDB
// });

beforeAll(
    initDB
);


let code = '';
let token = '';
let user_id = '';
let employee_id = '';


describe('Endpoints para el usuario',() => {

    test('Registrar un usuario nuevo', async () => {
        const res = await request(app).post('/users/signup')
                                            .send(employee01)
                                            .expect(201)
        
        // Buscamos el usuario devuelto en la base de datos
        const user = await Signup.findById( employee01Id )
        expect(user).not.toBeNull()
    
        // Validamos que el password este hasheado
        expect(user.password).not.toBe('123456')

        //Validamos que se devuelvan todos los campos obligatorios
        expect(user.name).not.toBeUndefined()
        expect(user.name).toBe(employee01.name)
        expect(user.lastname).not.toBeUndefined()
        expect(user.lastname).toBe(employee01.lastname)
        expect(user.second_lastname).not.toBeUndefined()
        expect(user.second_lastname).toBe(employee01.second_lastname)
        expect(user.email).not.toBeUndefined()
        expect(user.email).toBe(employee01.email)

        code = res.body.signup.code
    });

    test('Intentar registrar un usuario no enviando un campo requerido', async () => {
        const res = await request(app).post('/users/signup')
                                            .send(employee02)
                                            .expect(400)
    });
    
    test('Crear usuario con el código enviado a su correo', async() => {
        const res = await request(app).post(`/users/create/${code}`)
                                        .send()
                                        .expect(201)

        //Validamos que el token del usuario sea válido
        let data = res.body.user;
        const user = await User.findOne( {email: data.email})
        expect(user).not.toBeNull()
        expect(res.body).toMatchObject({token: user.tokens[0].token});

        //Validamos que los campos obligatorios tengan los datos correctos
        expect(user).toMatchObject({
            name: employee01.name,
            lastname: employee01.lastname,
            second_lastname: employee01.second_lastname,
            email: employee01.email
        });
    });

    test('Loguear un usuario existente', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email: employee01.email,
                                                    password: employee01.password
                                                })
                                                .expect(200)

        //Guardamos el token para realizar las demás peticiones
        token = res.body.token;
    })

    test('Loguear un usuario inexistente', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email: 'user@gmail.com',
                                                    password: '123456'
                                                })
                                                .expect(400)

        expect(res.text).toBe('Error: Username does not exist...')
    });

    test('Password Incorrecto', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email:  employee01.email,
                                                    password: '12345678'
                                                })
                                                .expect(400);

        expect(res.text).toBe('Error: Verify your password...')
    });


    test('Obtener datos del usuario logueado' , async() => {
        const res = await request(app).get('/users/me')
                                            .set('Authorization', `Bearer ${token}`)
                                            .expect(200);

        //Validamos los campos devueltos 
        expect(res.body).toMatchObject({
            name: employee01.name,
            lastname: employee01.lastname,
            second_lastname: employee01.second_lastname,
        });
    });

    test('Intentar acceder a una ruta sin el token' , async() => {
        await request(app).get('/users/me')
                                            .send()
                                            .expect(401);
    });

    test('Actualizar los datos del usuario logueado', async() => {
        const res = await request(app).patch('/users/me')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            name: 'LUIS'
                                        })
                                        .expect(200)
        
        //Comprobar que el campo se hay actualizado
        expect(res.body.name).toEqual('LUIS')
    });

    test('No permitir actualizar campos inválidos', async() => {
        await request(app).patch('/users/me')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            name: 'LUIS',
                                            email: 'solorzano@gmail.com' //El usuario no podrá actualizar su cuenta de email
                                        })
                                        .expect(400)
    });

    test('Intentar actualizar los datos del usuario logueado sin enviar el token', async() => {
        const res = await request(app).patch('/users/me')
                                        .send({
                                            name: 'KEVIN EDUARDO'
                                        })
                                        .expect(401)

        expect(res.text).toBe('No authorization!');
    });

    test('Cargar avatar al usuario logueado', async() => {
        const res = await request(app).post('/users/me/avatar')
                                            .set('Authorization', `Bearer ${token}`)
                                            .attach('avatar', 'src/test/img/Luis.jpg')
                                            .expect(200)
    });

    test('Decodificar el token del usuario actual para buscar su avatar', () => {
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
        user_id = decoded._id;
    })

    test('Obtener el avatar de cualquier usuario', async () => {
        const res = await request(app).get(`/users/${user_id}/avatar`)
                                        .send()
                                        .expect(200)
        //Validamos el tipo de dato devuelto
        expect(res.body).toEqual(expect.any(Buffer))
    });

    test('Eliminar el avatar del usuario logueado', async () => {
        await request(app).delete('/users/me/avatar')
                                        .set('Authorization', `Bearer ${token}`)
                                        .expect(200)
    });

    test('Si el usuario no tiene avatar devuelve error', async () => {
        const res = await request(app).get(`/users/${user_id}/avatar`)
                                        .send()
                                        .expect(404)
    });

    test('Cerrar la sesión actual del usuario logueado', async() => {
        await request(app).post('/users/logout')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
    });

    test('Intentar obtener datos del usuario, usando el token eliminado al cerrar la sesión' , async() => {
        const res = await request(app).get('/users/me')
                                            .set('Authorization', `Bearer ${token}`)
                                            .expect(401);

        expect(res.text).toBe('No authorization!');
    });

    test('Loguear nuevamente el usuario', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email: employee01.email,
                                                    password: employee01.password
                                                })
                                                .expect(200)
        token = res.body.token;
    })

    test('Cerrar todas las sesiones del usuario logueado', async() => {
        await request(app).post('/users/logoutall')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
    });

    test('Recuperar contraseña', async() => {
        const res = await request(app).post('/users/recoverpassword')
                            .send({
                                email: employee01.email,
                            })
                            .expect(200)

        //Validamos que sí nos haya devuelto un código
        expect(res.body.code).not.toBeUndefined();
        code = res.body.code;
    });

    test('Ingresar un código inválido para reestablecer la contraseña', async() => {
        const res = await request(app).post('/users/verifycode')
                                        .send({
                                            code: '123ABC654W'
                                        })
                                        .expect(400)
        
        expect(res.text).toBe('Error: Code not found!!')
    });
    
    test('Ingresar el código válido para reestablecer la contraseña', async() => {
        const res = await request(app).post('/users/verifycode')
                            .send({
                                code
                            })
                            .expect(200)

        // comprobamos que el código sea del usuario que solicitó el cambio de contraseña
        expect(res.body.email).toEqual(employee01.email);
    });

    test('Ingresar la nueva contraseña', async() => {
        const res = await request(app).post('/users/newpassword')
                                        .send({
                                            email: employee01.email,
                                            password: 'luis123'
                                        })
                                        .expect(200);
    })

    test('Intentamos hacer login con la primer contraseña', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email: employee01.email,
                                                    password: employee01.password
                                                })
                                                .expect(400)
        
        expect(res.text).toBe('Error: Verify your password...')
    });

    test('Loguearse con la nueva contraseña', async () => {
        const res  =  await request(app).post('/users/login')
                                                .send({
                                                    email: employee01.email,
                                                    password: 'luis123'
                                                })
                                                .expect(200);

        //Verificamos que se devuelvan los datos del usuario      
        expect(res.body.user).toMatchObject({
            name: 'LUIS',
            lastname: employee01.lastname,
            second_lastname: employee01.second_lastname,
            email: employee01.email
        });
    });

});


//Para los siguientes endpoints nos logueamos con el usuario de conserva
test('Loguearse con el usuario de conserva', async () => {
    const res  =  await request(app).post('/users/login')
                                    .send({
                                        email: conserva.email,
                                        password: '123456'
                                    })
                                    .expect(200);

    token = res.body.token;
});

describe('Enpoints para el control de empleados', () => {

    test('Crear un nuevo empleado', async() => {
        const res = await request(app).post('/employees')
                            .set('Authorization', `Bearer ${token}`)
                            .send(employee03)
                            .expect(201)
        employee_id = res.body.employee_id;

        //Verificamos que el password no esté en texto plano
        expect(res.body.password).not.toBe('123456');

        //Validamos que devuelva los campos obligatorios
        expect(res.body).toMatchObject({
            name: employee03.name,
            lastname: employee03.lastname,
            second_lastname: employee03.second_lastname,
            email: employee03.email
        })

    });

    test('Intentar crear un empleado sin un campo requerido', async() => {
        const res = await request(app).post('/employees')
                            .set('Authorization', `Bearer ${token}`)
                            .send(employee02)
                            .expect(400)
    });

    test('Obtener todos los registros de empleados', async() => {
        const res = await request(app).get('/employees')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
        // console.log(res.body);
    });

    test('Obtener el registro de un empleado existente', async() => {
        const res = await request(app).get(`/employees?id=${employee_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
    });

    test('Obtener el registro de un empleado inexistente', async() => {
        const res = await request(app).get('/employees?id=629638accbe70908b4b94d73')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the employee');
    });

    test('Actualizar datos de un empleado', async() => {
        const res = await request(app).patch(`/employees/${employee_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send({
                                name: 'DAVID',
                                lastname: "SUAREZ",
                                email: 'suarez@gmail.com'
                            })
                            .expect(200)

        expect(res.body).toMatchObject({
            name: 'DAVID',
            lastname: "SUAREZ",
            email: 'suarez@gmail.com'
        });
    });

    test('Deshabilitar un empleado junto con su usuario', async() => {
        const res = await request(app).delete(`/employees/${employee_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send()
                            .expect(200)
        //Verificamos que el campo deleted se haya activado
        const data = res.body.user;
        expect(data.deleted).toBe(true)
    });

    test('Tratar de obtener los datos de un empleado deshabilido', async() => {
        const res = await request(app).get(`/employees?id=${employee_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the employee');
    });

    test('Habilitar el empleado y su usuario', async() => {
        const res = await request(app).post(`/employees/restore/${employee_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
        
        //Verificamos que el campo deleted se haya desactivado
        const data = res.body.user;
        expect(data.deleted).toBe(false)
    });

});

let client_id = '';

describe('Endpoints para el control de clientes', () => {

    test('Intentar acceder a los endpoints sin enviar el token', async() => {
        const res = await request(app).post('/clients')
                                        .send(client01)
                                        .expect(401)
        expect(res.text).toBe('No authorization!')
    });

    test('Registrar un nuevo cliente', async() => {
        const res = await request(app).post('/clients')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(client01)
                                        .expect(201)
        client_id = res.body._id;
        //Validamos que devuelva los campos obligatorios
        expect(res.body).toMatchObject({
            name: client01.name,
            lastname: client01.lastname,
            second_lastname: client01.second_lastname,
            email: client01.email
        })
    });

    test('Registrar un nuevo cliente sin campos requeridos', async() => {
        
        const res = await request(app).post('/clients')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(client02)
                                        .expect(400)
    });

    test('Obtener todos los registros de clientes', async() => {
        const res = await request(app).get('/clients')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
    });

    test('Obtener el registro de un cliente existente', async() => {
        const res = await request(app).get(`/clients?id=${client_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
    });

    test('Obtener el registro de un cliente inexistente', async() => {
        const res = await request(app).get('/clients?id=629638accbe70908b4b94d73')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the client');
    });

    test('Actualizar datos de un cliente', async() => {
        const res = await request(app).patch(`/clients/${client_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send(personalReferences_update)
                            .expect(200)

        const data = res.body.personal_references
        //comparamos los datos actualizados
        expect(data[0].name).not.toBe('DAVID');
        expect(data[0]).toMatchObject({
            name: 'MARCOS',
            lastname: 'HERNANDEZ',
            second_lastname: 'SANCHEZ'
        })
    });

    test('Deshabilitar un cliente', async() => {
        const res = await request(app).delete(`/clients/${client_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send()
                            .expect(200)

        //Verificamos que el campo deleted se haya activado
        const data = res.body.client;
        expect(data.deleted).toBe(true);
    });

    test('Tratar de obtener los datos de un cliente deshabilido', async() => {
        const res = await request(app).get(`/clients?id=${client_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the client');
    });

    test('Habilitar el cliente', async() => {
        const res = await request(app).post(`/clients/restore/${client_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)

        //Verificamos que el campo deleted se haya desactivado
        const data = res.body.client;
        expect(data.deleted).toBe(false);
    });

});

let product_id = '';

describe('Enpoints para el control de productos', () => {

    test('Intentar acceder a los endpoints sin enviar el token', async() => {
        const res = await request(app).post('/products')
                                        .send(product01)
                                        .expect(401)
        expect(res.text).toBe('No authorization!')
    });

    test('Registrar un nuevo producto', async() => {
        const res = await request(app).post('/products')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(product01)
                                        .expect(201)
        
        //Verificamos que nos devuelva los campos onbligatorios
        expect(res.body).toMatchObject({
            product_type: product01.product_type,
            product_name: product01.product_name,
            min_amount: product01.min_amount,
            max_amount: product01.max_amount,
            min_term: product01.min_term,
            max_term: product01.max_term
        })

        product_id = res.body._id;
    });

    test('Registrar otro producto', async() => {
        const res = await request(app).post('/products')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(product02)
                                        .expect(201)
    });

    test('Registrar un nuevo producto sin campos requeridos', async() => {
        
        const res = await request(app).post('/products')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send(product03)
                                        .expect(400)
    });

    test('Obtener todos los registros de productos', async() => {
        const res = await request(app).get('/products')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)

        //Verificamos que se nos traiga los 2 registros que hicimos a la colección de productos
        expect(res.body.length).toBe(2)
    });

    test('Obtener el registro de un producto existente', async() => {
        const res = await request(app).get(`/products?id=${product_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)
        
        //Verificamos que se nos traiga un solo registro
        expect(res.body.length).toBe(1)
    });

    test('Obtener el registro de un producto inexistente', async() => {
        const res = await request(app).get('/products?id=629638accbe70908b4b94d73')
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the product(s)');
    });


    test('Actualizar datos de un producto', async() => {
        
        const res = await request(app).patch(`/products/${product_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send(product01_update)
                            .expect(200)

        //comparamos los datos actualizados
        expect(res.body.product_type).not.toBe(product01.product_type);
        expect(res.body.product_name).toBe(product01_update.product_name);
        expect(res.body.logo).toBe(MDP_logo);
    });

    test('Deshabilitar un producto', async() => {
        const res = await request(app).delete(`/products/${product_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .send()
                            .expect(200)
        
        //Verificamos que el producto se hay deshabilitado
        expect(res.body.deleted).toBe(true)
    });

    test('Tratar de obtener los datos de un producto deshabilitado', async() => {
        const res = await request(app).get(`/products?id=${product_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(400)

        expect(res.text).toBe('Error: Not able to find the product(s)');
    });

    test('Habilitar el producto', async() => {
        const res = await request(app).post(`/products/restore/${product_id}`)
                            .set('Authorization', `Bearer ${token}`)
                            .expect(200)

        //Verificamos que el producto se hay habilitado
        expect(res.body.deleted).toBe(false)
    });

});


// afterAll(() => {
//     console.log('cerrar la base de datos')
//     mongoose.disconnect(process.env.MONGOOSE_URL_CONNECTION)
// });