import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoute from './routes/userRoutes.js';
import medicamentosRouter from './routes/medicamentosRouter.js'
import sedesRouter from './routes/sedesRouter.js'
import epsRouter from './routes/epsRouter.js'
import rolesRouter from './routes/rolesRouter.js'
import equivalenciasRouter from './routes/equivalenciasRouter.js'
import consultasRouter from './routes/consultasRouter.js'
import iaRouter from './routes/iaRouter.js'
import morgan from 'morgan';


const app = express();  

app.use(express.json());
app.use(cors());
app.use(morgan())
app.use('/api/usuarios', userRoute);
app.use('/api/medicamentos', medicamentosRouter);
app.use('/api/sedes', sedesRouter);
app.use('/api/eps', epsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/equivalencias', equivalenciasRouter);
app.use('/api/consultas', consultasRouter);
app.use('/api/ia', iaRouter);




app.listen(3000, () => {
  console.log('Server is running on port http://localhost:3000/api');
});
