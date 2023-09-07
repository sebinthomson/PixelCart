const path = require("path");
const logger = require('morgan');
const express = require("express");
const app = express();
const session = require("express-session");
const nocache=require('nocache');
const fileUpload = require('express-fileupload');
const exphbs = require('express-handlebars')
const config = require("./config/config");
const userRoute = require('./routes/index');
const adminRoute = require('./routes/admin');

app.use(session({ secret: config.sessionSecret, saveUninitialized: true, resave: false }));

const hbs = exphbs.create({
	extname: '.hbs',
	defaultLayout: 'layout',
	layoutsDir: path.join(__dirname, 'views'),
	partialsDir: path.join(__dirname, 'views/partials'),
	helpers: require('./helpers/handlebarHelpers'),
	runtimeOptions: { allowProtoPropertiesByDefault: true, allowedProtoMethodsByDefault: true },
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(fileUpload());

app.engine("hbs",hbs.engine)
app.set('view engine', 'hbs');


//for user routes
app.use('/', userRoute);

//for admin routes
app.use('/admin', adminRoute);

// Handle undefined routes (404)
app.use((req, res, next) => {
    res.status(404).render('error-404'); 
});

app.listen(5000, function () {
    console.log("Server is running...");
});