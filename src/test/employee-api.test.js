const request = require('supertest');
const app = require('../app');
const Employee = require('../model/employee');
const User = require('../model/user');
const {id_employee1, employee1, user1, initDB} = require('./db/db')

beforeAll(initDB);

describe('Enpoints para los empleados', () => {

    

});