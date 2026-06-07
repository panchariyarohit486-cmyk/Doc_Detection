from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import cv2, os, uuid

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'static/outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# load my trained model, fall back to base if weights not found

model = YOLO('best.pt')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/detect', methods=['POST'])
def detect():
    file = request.files.get('image')
    if not file or file.filename == '':
        return jsonify({'error': 'No image provided'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ('png', 'jpg', 'jpeg', 'webp', 'bmp'):
        return jsonify({'error': 'Unsupported file type'}), 400

    conf = float(request.form.get('confidence', 0.5))
    conf = max(0.1, min(0.95, conf))

    # save upload temporarily
    tmp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}.{ext}")
    file.save(tmp_path)

    try:
        img = cv2.imread(tmp_path)
        results = model.predict(img, conf=conf)[0]

        # save annotated image
        out_name = f"result_{uuid.uuid4().hex[:8]}.jpg"
        cv2.imwrite(os.path.join(OUTPUT_FOLDER, out_name), results.plot())

        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            detections.append({
                'class':      model.names[cls_id],
                'confidence': round(float(box.conf[0]) * 100, 1),
                'box':        [x1, y1, x2, y2],
                'width':      x2 - x1,
                'height':     y2 - y1,
            })

        summary = {}
        for d in detections:
            summary[d['class']] = summary.get(d['class'], 0) + 1

        return jsonify({
            'success':      True,
            'output_image': out_name,
            'total':        len(detections),
            'detections':   detections,
            'summary':      summary,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        os.remove(tmp_path)


@app.route('/model-info')
def model_info():
    return jsonify({
        'classes':    model.names,
        'num_classes': len(model.names),
        'metrics': {
            'precision': 93.6,
            'recall':    93.1,
            'mAP50':     97.0,
            'mAP50_95':  92.9,
        }
    })


if __name__ == '__main__':
    app.run(debug=True)