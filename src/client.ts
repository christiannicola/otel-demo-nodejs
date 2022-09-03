import http from 'http';

interface FactorialResult {
    result: number
}

function generateNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function makeRequest(url: string): Promise<FactorialResult> {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            if (response.statusCode != null && response.statusCode >= 300) reject(new Error(`request failed - received code ${response.statusCode}`));

            const body: string[] = [];

            response.on('data', (chunk: string) => body.push(chunk));

            response.on('end', () => {
                const result = body.join('');
                console.log(result);
                const factorial: FactorialResult = JSON.parse(result);

                resolve(factorial);
            });
        })

        request.on('error', (err) => reject(err));
    })
}

async function fetchFactorial(): Promise<void> {
    const n = generateNumber(1, 100);
    const response = await makeRequest(`http://localhost:8080/${n}`);
    console.log(response.result);
}

setInterval(fetchFactorial, 1500);