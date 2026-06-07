#  YOLO Document Detector

A fine-tuned **YOLOv11** model for detecting and localizing document layout elements — **figures**, **tables**, and **text blocks** — in academic papers and document images. Built with a Flask web application for easy inference.

---

##  Demo

Upload a document page image and get instant bounding box predictions with class labels and confidence scores.

![Output Example](static/images/sample.jpg)

---

##  Project Structure

```
yolo-doc-detector/
│
├── model/
│   ├── best.pt 
│   │              # Fine-tuned YOLOv11 weights
│   └── Doc_Detection.ipynb      # Training & fine-tuning notebook
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   ├── images/                  # Sample/demo images
│
├── templates/
│   └── index.html
├── .gitignore
├── app.py                       # Flask entry point
├── README.md
└── requirements.txt
```

---

## 🤖 Model Performance

Fine-tuned **YOLOv11** on a document layout detection dataset with 3 classes: `figure`, `table`, `text`.

### Overall Metrics

| Metric        | Score  |
|---------------|--------|
| mAP@50        | 0.970  |
| mAP@50-95     | 0.910  |
| Precision     | 0.950  |
| Recall        | 0.930  |
| Best F1       | 0.93 @ conf=0.48 |

### Per-Class AP@0.5

| Class   | AP@0.5 | Instances |
|---------|--------|-----------|
| figure  | 0.985  | 4,477     |
| text    | 0.964  | 29,988    |
| table   | 0.959  | 3,100     |

### Training Details

| Parameter     | Value         |
|---------------|---------------|
| Base Model    | YOLOv11       |
| Epochs        | 10            |
| Confidence Threshold | 0.48   |
| IoU Threshold | 0.45          |
| Classes       | figure, table, text |

### Training Curves

All training and validation losses decreased consistently over 10 epochs with no signs of overfitting.

### Confusion Matrix (Normalized)

| Predicted \ True | figure | table | text |
|-----------------|--------|-------|------|
| figure          | 0.97   | 0.01  | —    |
| table           | —      | 0.93  | —    |
| text            | 0.01   | 0.04  | 0.97 |

> **Note:** The main source of error is background regions being misclassified as `text` (0.92), which is expected given the heavy class imbalance (text dominates with ~30K instances).

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/yolo-doc-detector.git
cd yolo-doc-detector
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Download model weights

Place `best.pt` inside `model/weights/`:

```
model/weights/best.pt
```

> If weights are hosted externally, download with:
> ```bash
> # Example (update with your actual link)
> wget -O model/weights/best.pt "YOUR_DOWNLOAD_LINK"
> ```

---

## ▶️ Usage

### Run the Flask app

```bash
python app.py
```

Then open your browser at: `http://localhost:5000`

### Run inference directly (Python)

```python
from utils.predict import run_inference

results = run_inference("path/to/document_page.jpg", conf=0.48)
print(results)
```

---

## 🔧 Configuration

Edit `config/config.yaml` to adjust model settings:

```yaml
model:
  weights_path: model/weights/best.pt
  confidence: 0.48
  iou_threshold: 0.45

upload:
  max_size_mb: 10
  allowed_extensions: [jpg, jpeg, png, pdf]
```

---

## 📦 Requirements

```
ultralytics
flask
opencv-python
pillow
pyyaml
torch
torchvision
```

Install all with:

```bash
pip install -r requirements.txt
```

---

## 🗂️ Dataset

The model was trained on a document layout dataset containing academic paper pages with annotations for:

- **Text blocks** (~30K instances)
- **Figures** (~4.5K instances)
- **Tables** (~3.1K instances)

Annotations cover bounding boxes across varied document layouts.

---

## 📈 Future Improvements

- Train for more epochs (20–50) — curves are still improving at epoch 10
- Address class imbalance with weighted loss or oversampling for `figure` and `table`
- Add support for PDF input (page-by-page inference)
- Deploy to Hugging Face Spaces or Render

---

## 🙏 Acknowledgements

- [Ultralytics YOLOv11](https://github.com/ultralytics/ultralytics)
- [DocLayNet Dataset](https://github.com/DS4SD/DocLayNet)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
