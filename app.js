import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import pg from 'pg';
import ejs from 'ejs';

const port = process.env.PORT || 3000;

const app = express();

const db = new pg.Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true
})

// const db = new pg.Client({
//     connectionString: connectionString,
//     ssl: {
//       rejectUnauthorized: false, // Necessary if using self-signed certificates (not recommended for production)
//     },
//   });

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

// Fetch all Book Details from the Table 
app.get("/", async (req, res)=>{
    try{
        const result = await db.query(`Select * from books Order by bookid Asc`);
        const books = result.rows;
        // const cover = await axios.get(`${books.coverurl}`);
        res.render("index.ejs",{ books});
    }
    catch(err){
        console.log(err.message);
    }
   
})

//Fetch all Book details in a sorting order based on recently added.
app.get("/recent", async (req, res)=>{
    try{
        const result = await db.query(`Select * from books Order by bookid Desc`);
        const books = result.rows;
        // const cover = await axios.get(`${books.coverurl}`);
        res.render("index.ejs",{ books});
    }
    catch(err){
        console.log(err.message);
    }
   
})

//Fetch all Book details in a sorting order based on its rating.

app.get("/rating", async (req, res)=>{
    try{
        const result = await db.query(`Select * from books Order by rating Desc`);
        const books = result.rows;
        // const cover = await axios.get(`${books.coverurl}`);
        res.render("index.ejs",{ books});
    }
    catch(err){
        console.log(err.message);
    }
   
})

//Authorized users can add new books to the database, including relevant information and cover images.
app.get(`/${process.env.ADD}`, (req, res)=>{
    res.render("add.ejs")
})

//The data newly added details will be inserted to the book table and it will shown in the main page
app.post(`/${process.env.ADD}`, async (req, res)=>{
    const books = req.body;
    
    try{
        const query = {
            text: 'INSERT INTO books (title, author, isbn, rating, review, coverurl) VALUES ($1, $2, $3, $4, $5, $6)',
            values: [books.title, books.author, books.isbn, books.rating, books.review, books.coverurl],
          };
        await db.query(query);
    }

    catch(err){
        console.log(err.stack);
    }
    res.redirect("/")
})

//Get a particular user defined book details. This will shown in a seperate page.
app.get("/read/:id", async(req, res)=>{
    const id = req.params.id;

    try{
        const query = {
            text: 'Select * from books where bookid = $1',
            values: [id]
        }
        const book = await db.query(query);
        res.render("read.ejs",{book: book.rows[0]});
    }
    catch(err){
        console.log(err.message);
    }
})

//Authorized users can Edit a particular book details 
app.get(`/read/:id/${process.env.ADD}/edit`, async(req, res)=>{
    const id = req.params.id;

    try{
        const query = {
            text: 'select * from books where bookid = $1',
            values: [id]
        }
        const book = await db.query(query);
        res.render("edit.ejs",{book: book.rows[0]});
    }
    catch(err){
        console.log(err.message);
    }
})

//Edited details will added to the same id
app.post("/publish/:id", async(req, res)=>{
    const id = req.params.id;
    const book = req.body;
    
    try{
        const query = {
            text: 'Update books Set title=$1, author=$2, isbn=$3, rating=$4, coverurl=$5, review=$6 Where bookid=$7',
            values: [book.title, book.author,book.isbn, book.rating, book.coverurl, book.review ,id]
        }
        await db.query(query);
        res.redirect('/');
    }
    catch(err){
        console.log(err.message);
    }
})

//Authorized users can Delete a particular book details 
app.get(`/read/:id/${process.env.DELETE}`, async (req,res)=>{
    const id = req.params.id;
    const query={
        text: `Delete From books Where bookid=$1`,
        values: [id]
    }
    try{
        await db.query(query);
    }
    catch(err){
        console.log(err.message);
    }
    res.redirect('/')
})

//Documentation section
app.get("/docs", (req, res)=>{
    res.render("docs.ejs")
})

//Contact page with a comment section
app.get("/contact",async (req, res)=>{
    
    try{
        const comments = await db.query(`Select * from comments Order By id Asc`);
        if(comments.rows.length !== 0){
        res.render("contact.ejs",{comments:comments.rows});
        }
       
        else{
            res.render("contact.ejs");
        }
    }
    catch(err){
        console.log(err.message)
    }
})

//comments will be added to the comment table
app.post("/contact",async (req, res)=>{
    const data = req.body;
    const query={
        text: `Insert Into comments (name, comment) Values ($1, $2)`,
        values: [data.name, data.comment]
    }
    try{
        await db.query(query);
    }
    catch(err){
        console.log(err.message)
    }
    res.redirect("contact")
})

//Hosting
app.listen(port, ()=>{
    console.log("Listening to port", port);
})