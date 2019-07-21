window.onload = (function() {

	var cw = new KeyframesBuilder("cameraWork");
	cw.hook("transform3d", KeyframesUtil.CameraWork3DTransform);

	for(var i = 0; i < 10; i++) {
		cw.seek(i * 300).gazeFrom([0, -i * 300, 1000 + i * 300].rotatey(0.5 * i));
	}
	for(var i = 0; i < 16; i++) {
		cw.after(300).gazeFrom([-1000, -1000, -1000], [0, -100, 0], [0, -1, 0].rotatez(i.toRadian() / 16));
	}
	for(var i = 0; i < 7; i++) {
		var g = [
			[0, 0, 0],
			[-250, 0, 0],
			[250, 0, 0],
			[0, -250, 0],
			[0, 250, 0],
			[0, 0, -250],
			[0, 0, 250]
		]
		cw.after(500).gazeFrom([1000, -100, 100].rotatey(0.5 * i), g[i]);
		cw.after(500).gazeFrom([1000, -100, 100].rotatey(0.5 * i), g[i]);
	}
	for(var i = 0; i < 10; i++) {
		var z = (i - 5) * 200;
		cw.after(300).gazeFrom([0, 0, z], [0, 0, z + 10]);
	}
	for(var i = 0; i < 10; i++) {
		var y = (i - 5) * 300;
		cw.after(300).gazeFrom([0, y, 1000].rotatey(0.5 * i), [0, 0, 0]);
	}
	for(var i = 0; i < 10; i++) {
		var z = (i - 5) * 200;
		cw.after(300).gazeFrom([0, 0, z], [0, 0, z + 10], [0, -1, 0].rotatez(i * 5));
	}
	for(var i = 0; i < 10; i++) {
		var z = (i - 5) * 2000;
		cw.after(300).gazeFrom([300, 0, z], [0, 0, 0], [0, -1, 0]);
	}
	for(var i = 0; i < 10; i++) {
		var x = (i - 5) * 2000;
		var z = (i - 5) * 2000;
		cw.after(300).gazeFrom([x, -250, z + 100], [0, 0, 0], [0, -1, 0]);
	}
	for(var i = 0; i < 10; i++) {
		var z = (i - 5) * 200;
		var r = (i - 5) * 50;
		cw.after(300).gazeFrom([0, r, 500].rotatey(0.5 * i), [0, 0, 0]);
	}
	cw.apply(null);
	$("#camera").addClass("cameraWork");
});
