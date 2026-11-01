class Problem {
    constructor(input) {
        if (this.constructor === Problem) {
            throw new Error("Cannot instantiate Abstract Class 'Problem' directly.");
        }
        this.input = input;
    }

    parseInput() {
        throw new Error("Method 'parseInput()' must be implemented by subclass.");
    }

    getInput() {
        return this.input;
    }
}

class IntegrateProblem extends Problem {
    constructor(input) {
        super(input);
    }

    parseInput() {
        try {
            const parsed = JSON.parse(this.input);
            if (!parsed.funcStr || parsed.a === undefined || parsed.b === undefined || !parsed.n) {
                throw new Error("โครงสร้างข้อมูลโจทย์ไม่ครบถ้วน");
            }
            return {
                funcStr: String(parsed.funcStr).trim(),
                a: parseFloat(parsed.a),
                b: parseFloat(parsed.b),
                n: parseInt(parsed.n, 10)
            };
        } catch (err) {
            throw new Error("ข้อผิดพลาดในการแปลงข้อมูลโจทย์: " + err.message);
        }
    }
}

class ProblemSolver {
    constructor(problem) {
        if (this.constructor === ProblemSolver) {
            throw new Error("Cannot instantiate Abstract Class 'ProblemSolver' directly.");
        }
        if (!(problem instanceof Problem)) {
            throw new Error("ProblemSolver requires a valid instance of class Problem.");
        }
        this.problem = problem;
    }

    getOutput() {
        throw new Error("Method 'getOutput()' must be implemented by subclass.");
    }
}

class TrapezoidalRuleSolver extends ProblemSolver {
    constructor(problem) {
        super(problem);
    }

    getOutput() {
        const { funcStr, a, b, n } = this.problem.parseInput();

        if (n <= 0) throw new Error("จำนวนช่วงย่อย (n) ต้องมากกว่า 0");
        if (a >= b) throw new Error("ค่าขอบเขตล่าง (a) ต้องน้อยกว่าขอบเขตบน (b)");

        let compiledExpr;
        try {
            compiledExpr = math.compile(funcStr);
        } catch (e) {
            throw new Error("สมการทางคณิตศาสตร์ไม่ถูกต้อง: " + e.message);
        }

        const evaluateFx = (xVal) => {
            return compiledExpr.evaluate({ x: xVal });
        };

        const h = (b - a) / n;
        const points = [];
        let sumInner = 0;

        for (let i = 0; i <= n; i++) {
            const xi = a + i * h;
            const fxi = evaluateFx(xi);
            
            let weight = 1;
            if (i > 0 && i < n) {
                weight = 2;
                sumInner += fxi;
            }

            points.push({
                i: i,
                x: xi,
                fx: fxi,
                weight: weight
            });
        }

        const f_a = points[0].fx;
        const f_b = points[n].fx;
        const result = (h / 2) * (f_a + f_b + 2 * sumInner);

        return {
            funcStr,
            a,
            b,
            n,
            h,
            points,
            f_a,
            f_b,
            sumInner,
            result
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const calcForm = document.getElementById('calcForm');
    const outputContainer = document.getElementById('outputContainer');
    const resultSummary = document.getElementById('resultSummary');
    const finalValue = document.getElementById('finalValue');
    const statusBadge = document.getElementById('statusBadge');
    const btnPreset = document.getElementById('btnPreset');

    btnPreset.addEventListener('click', () => {
        document.getElementById('functionInput').value = "x^7 + 2*x^3 - 1";
        document.getElementById('lowerBound').value = "-1";
        document.getElementById('upperBound').value = "2";
        document.getElementById('intervals').value = "6";
        calcForm.dispatchEvent(new Event('submit'));
    });

    calcForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const funcStr = document.getElementById('functionInput').value;
        const a = document.getElementById('lowerBound').value;
        const b = document.getElementById('upperBound').value;
        const n = document.getElementById('intervals').value;

        const rawJsonInput = JSON.stringify({ funcStr, a, b, n });

        try {
            statusBadge.className = "px-3 py-1 bg-indigo-900/50 text-indigo-300 border border-indigo-700 text-xs font-semibold rounded-full flex items-center gap-1.5";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span> กำลังคำนวณ...`;

            const integrateProblem = new IntegrateProblem(rawJsonInput);
            const solver = new TrapezoidalRuleSolver(integrateProblem);
            const outputData = solver.getOutput();

            renderSolutionSteps(outputData);

            finalValue.innerText = `I ≈ ${outputData.result.toFixed(8)}`;
            resultSummary.classList.remove('hidden');

            statusBadge.className = "px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold rounded-full flex items-center gap-1.5";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> คำนวณสำเร็จ`;

        } catch (error) {
            outputContainer.innerHTML = `
                <div class="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-start gap-3">
                    <i class="fa-solid fa-triangle-exclamation text-xl text-red-400 mt-0.5"></i>
                    <div>
                        <h4 class="font-bold mb-1">เกิดข้อผิดพลาดในการคำนวณ</h4>
                        <p class="text-xs text-red-300">${error.message}</p>
                    </div>
                </div>
            `;
            resultSummary.classList.add('hidden');
            
            statusBadge.className = "px-3 py-1 bg-red-950 text-red-300 border border-red-800 text-xs font-semibold rounded-full flex items-center gap-1.5";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400"></span> เกิดข้อผิดพลาด`;
        }
    });

    function renderSolutionSteps(data) {
        let tableRows = '';
        data.points.forEach((pt) => {
            tableRows += `
                <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 text-xs">
                    <td class="py-2 px-3 code-font text-indigo-400 font-semibold">i = ${pt.i}</td>
                    <td class="py-2 px-3 code-font text-slate-300">${pt.x.toFixed(4)}</td>
                    <td class="py-2 px-3 code-font text-emerald-300">${pt.fx.toFixed(8)}</td>
                    <td class="py-2 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${pt.weight === 2 ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'}">
                            ${pt.weight}x
                        </span>
                    </td>
                </tr>
            `;
        });

        outputContainer.innerHTML = `
            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">1. โจทย์และอินทิกรัลที่ต้องหา (Integral Statement)</h3>
                <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center text-sm">
                    \\[ I = \\int_{${data.a}}^{${data.b}} (${data.funcStr}) \\, dx \\]
                </div>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">2. คำนวณความกว้างช่วงย่อย (Step Size $h$)</h3>
                <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-sm">
                    \\[ h = \\frac{b - a}{n} = \\frac{${data.b} - (${data.a})}{${data.n}} = ${data.h} \\]
                </div>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">3. ตารางคำนวณค่า $f(x_i)$ แต่ละจุด</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                    <table class="w-full text-left">
                        <thead class="bg-slate-900 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                            <tr>
                                <th class="py-2.5 px-3">i</th>
                                <th class="py-2.5 px-3">$x_i$</th>
                                <th class="py-2.5 px-3">$f(x_i)$</th>
                                <th class="py-2.5 px-3">น้ำหนัก (Weight)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">4. แทนค่าลงในสูตร Composite Trapezoidal Rule</h3>
                <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-sm space-y-2 overflow-x-auto">
                    \\[ I = \\frac{h}{2} \\left[ f(x_0) + f(x_n) + 2 \\sum_{i=1}^{n-1} f(x_i) \\right] \\]
                    \\[ I = \\frac{${data.h}}{2} \\left[ ${data.f_a.toFixed(6)} + ${data.f_b.toFixed(6)} + 2(${data.sumInner.toFixed(6)}) \\right] \\]
                    \\[ I = ${data.result.toFixed(8)} \\]
                </div>
            </div>
        `;

        renderMathInElement(outputContainer, {
            delimiters: [
                { left: "\\[", right: "\\]", display: true },
                { left: "$", right: "$", display: false }
            ]
        });
    }

    calcForm.dispatchEvent(new Event('submit'));
});