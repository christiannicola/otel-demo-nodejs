import express from 'express';

interface RequestParameters {
    factorial: number;
}

function calcFactorial(n?: number): number {
    if (n == null) return 0;

    let result = 1;

    for (let i = 2; i <= n; i++) result *= i;

    return result;
}

const server = express();

server.get('/:factorial', (req:express.Request<RequestParameters>, res) => {
    res.send({ result: calcFactorial(req.params.factorial) });
})

server.listen(8080, () => {
    console.log("server started on port 8080");
})