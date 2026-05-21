#!/usr/bin/env python3
from pathlib import Path
import numpy as np

try:
    import onnx
    from onnx import helper, TensorProto, numpy_helper
except Exception as exc:
    raise SystemExit("Install ONNX first: pip install onnx\n" + str(exc))

out = Path("assets/models")
out.mkdir(parents=True, exist_ok=True)

# Input vector: [x,y,z, fracture_density, B4/B2, B6/B7, distance_from_klemm_m]
X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [None, 7])
Y = helper.make_tensor_value_info("confidence", TensorProto.FLOAT, [None, 1])

W = np.array([[0.04], [0.04], [0.02], [2.60], [1.90], [1.60], [-0.000035]], dtype=np.float32)
B = np.array([-3.10], dtype=np.float32)
scale = np.array([100.0], dtype=np.float32)

nodes = [
    helper.make_node("Gemm", ["input", "W", "B"], ["logit"], alpha=1.0, beta=1.0, transB=0),
    helper.make_node("Sigmoid", ["logit"], ["prob"]),
    helper.make_node("Mul", ["prob", "scale"], ["confidence"])
]

graph = helper.make_graph(
    nodes,
    "BOUH_TargetConfidence_v12_5",
    [X],
    [Y],
    [
        numpy_helper.from_array(W, "W"),
        numpy_helper.from_array(B, "B"),
        numpy_helper.from_array(scale, "scale")
    ]
)

model = helper.make_model(graph, producer_name="BOUH Terrain | Abu Aziza System")
onnx.checker.check_model(model)
onnx.save(model, out / "bouh_target_confidence_v12_5.onnx")
print(out / "bouh_target_confidence_v12_5.onnx")
