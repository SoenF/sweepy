#!/bin/bash
# Kill any existing node processes on 3000 or 5173 (optional, be careful)
# lsof -ti:3000 | xargs kill -9
# lsof -ti:5173 | xargs kill -9

echo "Starting Server..."
cd server
npm start > ../server.log 2>&1 &
SERVER_PID=$!

echo "Starting Client..."
cd ../client
npm run dev -- --host > ../client.log 2>&1 &
CLIENT_PID=$!

echo "Sweepy is running!"
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
