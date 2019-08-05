window.onload = (function() {

	var cw = new KeyframesBuilder("cameraWork");
	cw.hook("transform3d", KeyframesUtil.CameraWork3DTransform);

	var kb = new Keyboard();
	// shift
	kb.at(16).enablePrevent();
	// left
	kb.at(37).enablePrevent();
	kb.at("A").enablePrevent();
	// up
	kb.at(38).enablePrevent();
	kb.at("W").enablePrevent();
	// right
	kb.at(39).enablePrevent();
	kb.at("D").enablePrevent();
	// down
	kb.at(40).enablePrevent();
	kb.at("S").enablePrevent();

	var p = [-250, 250, 0];
	var rotateY = 0;
	var rotateX = 0;

	(function() {
		kb.flush();

		if(kb.at(16).pressing) {
			var s = [0, 0, 1].rotatey(rotateY).normalize(5);
			if(kb.at(37).pressing || kb.at("A").pressing) {
				s = s.rotatey((-0.25).toRadian());
				p = p.translate(s);
			}
			if(kb.at(39).pressing || kb.at("D").pressing) {
				s = s.rotatey((0.25).toRadian());
				p = p.translate(s);
			}
			if(kb.at(38).pressing || kb.at("W").pressing) {
				s = s.rotatey((-0.00).toRadian());
				p = p.translate(s);
			}
			if(kb.at(40).pressing || kb.at("S").pressing) {
				s = s.rotatey((-0.50).toRadian());
				p = p.translate(s);
			}
		} else {
			if(kb.at(37).pressing || kb.at("A").pressing) {
				rotateY -= 0.02;
			}
			if(kb.at(39).pressing || kb.at("D").pressing) {
				rotateY += 0.02;
			}
			if(kb.at(38).pressing || kb.at("W").pressing) {
				rotateX += 0.02;
			}
			if(kb.at(40).pressing || kb.at("S").pressing) {
				rotateX -= 0.02;
			}
		}
		var g = [0, 0, 100];
		var u = [0, -100, 0];
		g = g.rotatex(rotateX);
		g = g.rotatey(rotateY);
		u = u.rotatex(rotateX);
		u = u.rotatey(rotateY);
		cw.seek(0).gazeFrom(p, p.translate(g), u);
		cw.fixStyle($("#camera").get(0));
		window.setTimeout(arguments.callee, 33);
	})();
});
