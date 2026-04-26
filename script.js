class VortexInterferenceSimulator {
    constructor() {
        this.canvas = document.getElementById('interferenceCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 600;
        
        // 模拟参数
        this.params = {
            interferenceMode: 'plane', // 'plane' 涡旋光-平面波干涉或 'spherical' 涡旋光-球面波干涉
            topologicalCharge: 1, // 拓扑荷数
            wavelength: 632.8, // 波长 (nm)
            vortexAmplitude: 1, // 涡旋光振幅
            otherAmplitude: 1, // 平面波/球面波振幅
            phaseDifference: 0, // 相位差 (度)
            visualizationMode: 'intensity', // 'intensity' 或 'phase'
            scale: 1,
            offsetX: 0,
            offsetY: 0
        };
        
        // 鼠标交互
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initControls();
        this.initEventListeners();
        this.render();
    }
    
    initControls() {
        // 干涉模式
        document.querySelectorAll('input[name="interferenceMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.params.interferenceMode = e.target.value;
                this.render();
            });
        });
        
        // 拓扑荷数
        const chargeSlider = document.getElementById('topologicalCharge');
        const chargeValue = document.getElementById('topologicalChargeValue');
        chargeSlider.addEventListener('input', (e) => {
            this.params.topologicalCharge = parseInt(e.target.value);
            chargeValue.value = this.params.topologicalCharge;
            this.render();
        });
        chargeValue.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (value < -5) value = -5;
            if (value > 5) value = 5;
            this.params.topologicalCharge = value;
            chargeSlider.value = value;
            this.render();
        });
        
        // 波长
        document.getElementById('wavelength').addEventListener('input', (e) => {
            this.params.wavelength = parseFloat(e.target.value);
            this.render();
        });
        
        // 涡旋光振幅
        document.getElementById('vortexAmplitude').addEventListener('input', (e) => {
            this.params.vortexAmplitude = parseFloat(e.target.value);
            this.render();
        });
        
        // 其他波振幅
        document.getElementById('otherAmplitude').addEventListener('input', (e) => {
            this.params.otherAmplitude = parseFloat(e.target.value);
            this.render();
        });
        
        // 相位差
        document.getElementById('phaseDifference').addEventListener('input', (e) => {
            this.params.phaseDifference = parseFloat(e.target.value);
            this.render();
        });
        
        // 可视化模式
        document.querySelectorAll('input[name="visualizationMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.params.visualizationMode = e.target.value;
                this.render();
            });
        });
        
        // 保存截图
        document.getElementById('saveImage').addEventListener('click', () => {
            this.saveImage();
        });
    }
    
    initEventListeners() {
        // 鼠标拖动
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.params.offsetX += deltaX / this.params.scale;
                this.params.offsetY += deltaY / this.params.scale;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.render();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // 鼠标滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.params.scale *= zoomFactor;
            document.getElementById('canvasScale').textContent = `比例尺: ${this.params.scale.toFixed(1)}x`;
            this.render();
        });
    }
    
    calculateInterference(x, y) {
        // 转换坐标到以中心为原点
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const adjustedX = (x - centerX) / 100 * this.params.scale - this.params.offsetX;
        const adjustedY = (y - centerY) / 100 * this.params.scale - this.params.offsetY;
        
        // 计算极坐标
        const r = Math.sqrt(adjustedX * adjustedX + adjustedY * adjustedY);
        const theta = Math.atan2(adjustedY, adjustedX);
        
        // 涡旋光相位
        const vortexPhase = this.params.topologicalCharge * theta;
        
        // 其他波相位
        let otherPhase = 0;
        if (this.params.interferenceMode === 'plane') {
            // 平面波相位 (沿x轴传播)
            otherPhase = 2 * Math.PI * adjustedX / 10;
        } else if (this.params.interferenceMode === 'spherical') {
            // 球面波相位
            otherPhase = 2 * Math.PI * r / 10;
        }
        
        // 添加相位差
        otherPhase += this.params.phaseDifference * Math.PI / 180;
        
        // 计算电场（使用三角函数模拟复数）
        // 涡旋光
        const vortexReal = this.params.vortexAmplitude * Math.cos(vortexPhase);
        const vortexImag = this.params.vortexAmplitude * Math.sin(vortexPhase);
        // 其他波
        const otherReal = this.params.otherAmplitude * Math.cos(otherPhase);
        const otherImag = this.params.otherAmplitude * Math.sin(otherPhase);
        // 总电场
        const totalReal = vortexReal + otherReal;
        const totalImag = vortexImag + otherImag;
        
        // 计算强度和相位
        const intensity = totalReal * totalReal + totalImag * totalImag;
        const phase = Math.atan2(totalImag, totalReal);
        
        return { intensity, phase };
    }
    
    render() {
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let maxIntensity = 0;
        // 先计算最大强度以进行归一化
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const result = this.calculateInterference(x, y);
                if (result.intensity > maxIntensity) {
                    maxIntensity = result.intensity;
                }
            }
        }
        
        // 渲染图像
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const result = this.calculateInterference(x, y);
                let r, g, b;
                
                if (this.params.visualizationMode === 'intensity') {
                    // 强度可视化 (热图)
                    const normalizedIntensity = Math.min(1, result.intensity / maxIntensity);
                    // 热图：从蓝到红
                    if (normalizedIntensity < 0.25) {
                        r = 0;
                        g = Math.floor(normalizedIntensity * 4 * 255);
                        b = 255;
                    } else if (normalizedIntensity < 0.5) {
                        r = 0;
                        g = 255;
                        b = Math.floor((0.5 - normalizedIntensity) * 4 * 255);
                    } else if (normalizedIntensity < 0.75) {
                        r = Math.floor((normalizedIntensity - 0.5) * 4 * 255);
                        g = 255;
                        b = 0;
                    } else {
                        r = 255;
                        g = Math.floor((1 - normalizedIntensity) * 4 * 255);
                        b = 0;
                    }
                } else {
                    // 相位可视化 (彩色)
                    const normalizedPhase = (result.phase + Math.PI) / (2 * Math.PI);
                    const hue = normalizedPhase * 360;
                    const rgb = this.hslToRgb(hue, 1, 0.5);
                    r = Math.floor(rgb.r);
                    g = Math.floor(rgb.g);
                    b = Math.floor(rgb.b);
                }
                
                const index = (y * this.canvas.width + x) * 4;
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = 255; // 不透明度
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // 灰色
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h/360 + 1/3);
            g = hue2rgb(p, q, h/360);
            b = hue2rgb(p, q, h/360 - 1/3);
        }
        
        return { r: r * 255, g: g * 255, b: b * 255 };
    }
    
    saveImage() {
        const link = document.createElement('a');
        link.download = `vortex_interference_${this.params.interferenceMode}_m${this.params.topologicalCharge}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// 初始化模拟器
window.addEventListener('DOMContentLoaded', () => {
    new VortexInterferenceSimulator();
});