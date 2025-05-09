const response = await fetch("https://api.comfydeploy.com/api/run/deployment/queue", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yd09yRHpoVmxTMktvQ0FseW1CRjBDbmViejIiLCJpYXQiOjE3NDU5MzEzNjUsIm9yZ19pZCI6Im9yZ18yd094MFI1bTVhZjBoUjFicldvYXlVZFZ5QTUifQ.U1GubE6LOP8qMgMRmy9nOv0gTUrMPM1RDxCoY4UDYqQ"
    },
    body: JSON.stringify({
        "deployment_id": "b79e7c3c-affa-4712-bfe9-b078ba5293c1",
        "inputs": {
            "positive_prompt": "beautiful scenery nature glass bottle landscape, , purple galaxy bottle,",
            "negative_prompt": "text, watermark"
        }
    })
});

const data = await response.json();
console.log(data);



const response = await fetch("https://api.comfydeploy.com/api/run/" + data.run_id, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    }
});

const data = await response.json();
console.log(data);