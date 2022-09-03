import express from 'express';

// NOTE (c.nicola): Express serializes response objects with the `JSON.stringify` to create a
//                  string / uint8 buffer to send back over the wire. We hack the prototype of
//                  of the BigInt constructor to add the `toJSON` method ourselves.
//                  The reason for doing this by accessing the object via index notation is because
//                  Typescript won't compile if the we access that member directly - it's not part
//                  of the interface BigIntConstructor.
BigInt.prototype["toJSON"] = function() { return this.toString(); };

interface RequestParameters {
    factorial: number
}

function calcFactorial(n?: number): bigint {
    if (n == null) return 0n;

    let result = 1n;

    for (let i = 2n; i <= n; i++) result *= i;

    return result;
}

const server = express();

server.get('/:factorial', (req:express.Request<RequestParameters>, res) => {
    res.send({ result: calcFactorial(req.params.factorial) });
})

server.listen(8080, () => {
    console.log("server started on port 8080");
})