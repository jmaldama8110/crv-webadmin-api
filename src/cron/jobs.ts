import cron from 'node-cron';
import { updateLoanAppStatus } from '../routers/Actions';
import { findDbs } from '../utils/getHFBranches';

cron.schedule('* 6 * * *', async () => {
    // se ejecutara a las 23 horas de cada dia
    try{
        const dbList = await findDbs();
        
        console.log('NODE-CRON started... ')
        for(let x=0; x < dbList.length; x++){
            // console.log('Updating LoanApp status for',dbList[x])
            await updateLoanAppStatus(dbList[x])
        }
    }
    catch(e:any){
        console.log(`NODE-CRON FAILED error: ${e.message}`);
    }
});