from flask import Flask, render_template, jsonify, request
import random, heapq, time

app = Flask(__name__)

# Sample candidate pool (can be replaced with real data)
FIRST = ["Aarav","Ishaan","Priya","Sara","Rohit","Neha","Karan","Sana","Vikram","Anaya","Riya","Aditya","Meera","Vikram","Kabir"]
LAST = ["Sharma","Patel","Singh","Kumar","Rao","Gupta","Iyer","Nair","Kapoor","Das","Bose","Chawla"]

def random_candidate(i):
    name = random.choice(FIRST) + " " + random.choice(LAST)
    score = round(random.uniform(40, 100), 2)   # score out of 100
    exp = random.choice([0.5,1,2,3,4,5,6,7,8])
    role = random.choice(["SDE","Data Scientist","Frontend","Backend","DevOps","QA"])
    return {
        "id": f"C{i:03d}",
        "name": name,
        "score": score,
        "exp": exp,
        "role": role,
        "resume": f"https://example.com/resume/{i}"  # placeholder
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/candidates")
def api_candidates():
    # number param
    n = int(request.args.get("n", 12))
    cand = [random_candidate(i+1) for i in range(n)]
    # sort by score desc when delivering baseline
    return jsonify({"candidates": cand})

@app.route("/api/shortlist", methods=["POST"])
def api_shortlist():
    # backend quick shortlist using nlargest (safe check)
    data = request.json
    candidates = data.get("candidates", [])
    k = int(data.get("k", 5))
    # use score as key
    topk = heapq.nlargest(k, candidates, key=lambda x: x.get("score", 0))
    return jsonify({"topk": topk})

if __name__ == "__main__":
    app.run(debug=True)
