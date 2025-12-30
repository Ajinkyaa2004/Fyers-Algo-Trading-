import FyersAPI from "fyers-api-v3"

const fyersModel = FyersAPI.fyersModel
var fyers = new fyersModel({path:"./logs"})

// set appID - using the one from the auth code
fyers.setAppId("3XL42TP2PU")

// Define the authorization code and secret key
const auth_code = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiIzWEw0MlRQMlBVIiwidXVpZCI6IjNkMmZjZmE0ZWNjMTRhYmI5OTU0NjI2MmZiY2U0ZDUxIiwiaXBBZGRyIjoiIiwibm9uY2UiOiIiLCJzY29wZSI6IiIsImRpc3BsYXlfbmFtZSI6IkZBRzk2MTI0Iiwib21zIjoiSzEiLCJoc21fa2V5IjoiNjUwOWVkOGU2NDIzY2FjYzY1YjZiMDgwOWQyZTYyNjY2MjNhMzRiNTJhNDEzNTRkN2UxZjlhMTgiLCJpc0RkcGlFbmFibGVkIjoiTiIsImlzTXRmRW5hYmxlZCI6Ik4iLCJhdWQiOiJbXCJkOjFcIixcImQ6MlwiLFwieDowXCIsXCJ4OjFcIixcIng6MlwiXSIsImV4cCI6MTc2NjcyNTE1MCwiaWF0IjoxNzY2Njk1MTUwLCJpc3MiOiJhcGkubG9naW4uZnllcnMuaW4iLCJuYmYiOjE3NjY2OTUxNTAsInN1YiI6ImF1dGhfY29kZSJ9.lvUdKB9ZQp8IvCrdQGQonbPtdWrrXyj8xeshsGAlwWE"

// Replace with your secret key provided by Fyers
const secretKey = "RJ1W2XG5L4"

console.log("Generating access token with auth code...")
console.log("Auth Code:", auth_code.substring(0, 50) + "...")

fyers.generate_access_token({ "secret_key": secretKey, "auth_code": auth_code }).then((response) => {
    console.log("✓ Token Generated Successfully!")
    console.log(JSON.stringify(response, null, 2))
}).catch((error) => {
    console.log("✗ Error generating token:")
    console.log(error)
})
