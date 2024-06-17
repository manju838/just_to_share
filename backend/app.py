from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import boto3
import os

app = Flask(__name__)
CORS(app)

def run_build(project_name):
    try:
        print("start")
        subprocess.call("build.sh")
        
        # subprocess.run(['vite', 'build'], check=True, cwd='../multi-tenant-web-app/') # Tried this for windows, didn't work
        print("end")
        # return True
    except subprocess.CalledProcessError as e:
        print(f'Build failed: {str(e)}')
        return False

def sync_to_s3(project_name):
    try:
        s3 = boto3.client('s3')
        dist_folder = '../multi-tenant-web-app/dist'
        bucket_name = 'visualisation.propall' # Name of the bucket manually created in s3, we can automate it using awspipelines later
        s3_location = f'{project_name}'

        for root, dirs, files in os.walk(dist_folder):
            for file in files:
                s3.upload_file(
                    os.path.join(root, file),
                    bucket_name,
                    os.path.join(s3_location, os.path.relpath(os.path.join(root, file), dist_folder))
                )

        return True
    except Exception as e:
        print(f'Sync to S3 failed: {str(e)}')
        return False

@app.route('/build', methods=['POST'])
def build_and_upload():
    data = request.get_json()
    project_name = data.get('projectName')

    if not project_name:
        return jsonify({'error': 'Project name is required'}), 400

    if run_build(project_name) and sync_to_s3(project_name):
        return jsonify({'message': 'Build and upload successful!'}), 200
    else:
        return jsonify({'error': 'Build and upload failed.'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
