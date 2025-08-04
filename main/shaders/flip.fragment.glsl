uniform sampler2D uTexture;
uniform vec3 uColor;
uniform bool uUseColor;

varying vec2 vUv;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    if (uUseColor) {
        gl_FragColor = vec4(textureColor.rgb * uColor, textureColor.a);
    } else {
        gl_FragColor = textureColor;
    }
}
