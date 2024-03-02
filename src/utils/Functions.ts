export class Functions {
    constructor() {
    }
    validateInt(value:any, value_default = 0){
        value = (value == null ? 0 : value)
        return (value > 2147483647 ? value_default : value)
    }
    ConvertInt(value:any, value_default = 0){
        value = (value == null ? 0 : value)
        return (!Number.isInteger(value)  ? value_default : value)
    }
}