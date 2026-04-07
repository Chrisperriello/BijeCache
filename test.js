const axios = require('axios');

// Replace this with your Main Server's IP address
const SERVER_IP = '69.6.101.174'; 
const SERVER_PORT = '3000';
//From the output of the 
const uri = 'http://10.70.0.66:3000/active-sports'
async function getSportsFromServer() {
    console.log("Here1");
    try {
        const response = await axios.get(uri);
        console.log("Here2")
        const sportsList = response.data.sports;
        console.log(`Successfully received ${sportsList.length} sports from the Orchestrator!`);
        
        // Now this machine can start its own specialized work with the list
        console.log("First 3 sports:", sportsList.slice(0, 3));
        
    } catch (error) {
        console.error("Could not reach the Orchestrator:", error.message);
    }
}
console.log("Here3")
getSportsFromServer();