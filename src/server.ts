import express from 'express';

const server = express();

server.get('/', (req, res) => {
    console.log(req.query)
    res.sendStatus(200);
})

server.listen(8080, () => {
    console.log("server started on port 8080");
})