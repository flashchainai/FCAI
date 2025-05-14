from flask import Flask, request, jsonify
import random

app = Flask(__name__)
tasks = [
    "Analyze crypto sentiment",
    "Summarize DeFi news",
    "Predict token movement",
    "Generate AI insights"
]

@app.route('/get_task', methods=['GET'])
def get_task():
    return jsonify({"task": random.choice(tasks)})

@app.route('/submit_result', methods=['POST'])
def submit_result():
    data = request.json
    print(f"Task: {data['task']} | Miner: {data['miner']} | Result: {data['result']}")
    return jsonify({"status": "accepted"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
