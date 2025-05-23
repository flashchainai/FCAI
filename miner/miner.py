import requests, time
from transformers import pipeline
import psutil, pynvml
from colorama import Fore, Style

pynvml.nvmlInit()
gpu = pynvml.nvmlDeviceGetHandleByIndex(0)
ai = pipeline("text-generation", model="gpt2")
SERVER = "http://127.0.0.1:5000"
MINER = "Miner-001"

def get_stats():
    return psutil.cpu_percent(), psutil.virtual_memory().percent, \
        pynvml.nvmlDeviceGetUtilizationRates(gpu).gpu, \
        pynvml.nvmlDeviceGetMemoryInfo(gpu).used / 1e9

def mine():
    print(Fore.CYAN + "🚀 FCAI Miner started" + Style.RESET_ALL)
    while True:
        task = requests.get(f"{SERVER}/get_task").json().get("task")
        if not task:
            time.sleep(5)
            continue
        print(Fore.YELLOW + f"[Task] {task}" + Style.RESET_ALL)
        result = ai(task, max_length=30)[0]['generated_text']
        requests.post(f"{SERVER}/submit_result", json={"task": task, "result": result, "miner": MINER})
        cpu, ram, gpu_use, mem = get_stats()
        print(Fore.GREEN + f"[System] CPU: {cpu}%, RAM: {ram}%, GPU: {gpu_use}%, GPU MEM: {mem:.2f}GB" + Style.RESET_ALL)
        print("-" * 50)
        time.sleep(3)

if __name__ == '__main__':
    mine()
