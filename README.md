# Usage:
## Create react app trials
npm uninstall -g create-react-app <=== Removes any older react version
npm init react-app multi-tenant-web-app
cd multi-tenant-web-app
npm start

If npm start throws an error "Cannot find module 'ajv/dist/compile/codegen' Require stack: ...", then
rm -rf node_modules package-lock.json
npm install

npm start => Still throws an error

npx create-react-app my-app
cd my-app
npm start

## Create react app giving errors, using vitejs + React app
```bash
npm create vite@latest
cd multi-tenant-web-app
npm install
npm run dev
```

In a seperate bash terminal:
```bash
cd .. <=== Just come out of vite+react app's home folder
mkdir backend 
cd backend

python -m venv multitenant-webapp-backend <=== Create a virtual env and activate it
source multitenant-webapp-backend/bin/activate  # On Windows, use `multitenant-webapp-backend\Scripts\activate`
pip install Flask boto3 flask-cors <=== boto3 is used to sync files in s3
```
Add app.py in backend folder

Start flask server and npm run dev in vite-react app home folder.