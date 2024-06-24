"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const body_parser_1 = __importDefault(require("body-parser"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const date_fns_tz_1 = require("date-fns-tz");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
const User = zod_1.z.object({
    fullName: zod_1.z.string(),
    email: zod_1.z.string().email().min(5),
    countryCode: zod_1.z.string(),
    phoneNumber: zod_1.z.string(),
    message: zod_1.z.string().max(500),
    timeStamp: zod_1.z.string().refine(value => !isNaN(Date.parse(value)), {
        message: "Invalid date format"
    })
});
const corsOptions = {
    origin: 'https://grudhrasolutions.com',
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
};
app.use((0, cors_1.default)(corsOptions));
//test
app.use('/', (req, res) => {
    res.json({
        message: "hello from express app"
    });
});
app.post('/contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = User.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: result.error.errors });
    }
    const { fullName, email, countryCode, phoneNumber, message, timeStamp } = result.data;
    // Parse datetime from ISO-8601 format
    const localDateTime = new Date(timeStamp);
    // Optionally convert to IST timezone
    const istDateTime = (0, date_fns_tz_1.format)(localDateTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });
    // Convert back to ISO-8601 format
    const isoDateTime = new Date(istDateTime).toISOString();
    try {
        const user = yield prisma.user.create({
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
    }
    catch (error) {
        res.status(500).send('Database Error');
        console.error(error);
    }
}));
