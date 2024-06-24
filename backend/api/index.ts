import express, { Request, Response } from "express";
import { z } from "zod";
import bodyParser from 'body-parser';
import { PrismaClient } from "@prisma/client";
import cors from 'cors';
import { format } from "date-fns-tz";


const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());
app.use(cors())

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

const User = z.object({
  fullName: z.string(),
  email: z.string().email().min(5),
  countryCode: z.string(),
  phoneNumber: z.string(),
  message: z.string().max(500),
  timeStamp: z.string().refine(value => !isNaN(Date.parse(value)), {
    message: "Invalid date format"
  })
});

const corsOptions={
  origin:'https://grudhrasolutions.com',
  methods:['POST'],
  allowedHeaders:['Content-Type']
}

app.use(cors(corsOptions));

//test
app.use('/',(req:Request, res:Response)=>{
    res.json({
        message:"hello from express app"
    })
})

app.get("/", (req, res) => res.send("Express on Vercel"));


app.post('/api/contact', async (req: Request, res: Response) => {
  const result = User.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.error.errors });
  }

  const { fullName, email, countryCode, phoneNumber, message, timeStamp } = result.data;
  // Parse datetime from ISO-8601 format
  const localDateTime = new Date(timeStamp);
    
  // Optionally convert to IST timezone
  const istDateTime = format(localDateTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });

  // Convert back to ISO-8601 format
  const isoDateTime = new Date(istDateTime).toISOString();
  
  try {
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        countryCode,
        phNumber: phoneNumber,
        message,
        submittedAt: isoDateTime // Ensure timestamp is stored correctly
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).send('Database Error');
    console.error(error);
  }
});

module.exports=app;