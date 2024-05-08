import cron from 'node-cron';
import { updateLoanAppStatus } from '../routers/Actions';

cron.schedule('* 23 * * *', async () => {
    // se ejecutara a las 23 horas de cada dia
    try{
        console.log('NODE-CRON started... ')
        await updateLoanAppStatus();
    }
    catch(e:any){
        console.log(`NODE-CRON FAILED error: ${e.message}`);
    }
});