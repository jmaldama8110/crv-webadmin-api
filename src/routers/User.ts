import express from 'express';
import User from '../model/User';

const router = express.Router();

router.post("/users/hf/login", async (req, res) => {

    try {
      const user:any = await User.findUserByCredentialsHF(
        req.body.user,
        req.body.password
      );
        
      const token = await User.generateAuthTokenHf(user)
      res.status(200).send( {...user, token});
  
  } catch (error:any) {
    console.log(error);
    res.status(400).send(error.message);
  }
});





export { router as userRouter }