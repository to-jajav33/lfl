uniform float uRotate;
uniform float uTiltX;
varying vec2 vUv;

void main() {
    vUv = uv;
    float PI = 3.141;
    float tiltFactorX = uTiltX;
    
    float angle = (uv.x * (PI * tiltFactorX)) + uRotate;
    mat4 rotationMatrix = mat4(
        cos(angle),     0.0,    sin(angle),   0.0,
        0.0,            1.0,    0.0,           0.0,
        -sin(angle),    0.0,    cos(angle),    0.0,
        0.0,            0.0,    0.0,           1.0
    );
    
    
    gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix * vec4(position, 1.0);
}
