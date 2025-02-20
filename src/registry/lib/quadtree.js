export function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

const MAX_OBJECTS = 10;
const MAX_LEVELS = 4;

export class Quadtree {
  constructor(x, y, w, h, l) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.l = l || 0;
    this.o = [];
    this.q = null;
  }

  split() {
    let x = this.x,
      y = this.y,
      w = this.w / 2,
      h = this.h / 2,
      l = this.l + 1;

    this.q = [
      new Quadtree(x + w, y, w, h, l),
      new Quadtree(x, y, w, h, l),
      new Quadtree(x, y + h, w, h, l),
      new Quadtree(x + w, y + h, w, h, l),
    ];
  }

  quads(x, y, w, h, cb) {
    let hzMid = this.x + this.w / 2;
    let vtMid = this.y + this.h / 2;
    let startIsNorth = y < vtMid;
    let startIsWest = x < hzMid;
    let endIsEast = x + w > hzMid;
    let endIsSouth = y + h > vtMid;

    startIsNorth && endIsEast && cb(this.q[0]);
    startIsNorth && startIsWest && cb(this.q[1]);
    startIsWest && endIsSouth && cb(this.q[2]);
    endIsEast && endIsSouth && cb(this.q[3]);
  }

  add(o) {
    if (this.q != null) {
      this.quads(o.x, o.y, o.w, o.h, (quad) => {
        quad.add(o);
      });
    } else {
      this.o.push(o);
      if (this.o.length > MAX_OBJECTS && this.l < MAX_LEVELS) {
        this.split();
        this.o.forEach((obj) => {
          this.quads(obj.x, obj.y, obj.w, obj.h, (quad) => {
            quad.add(obj);
          });
        });
        this.o.length = 0;
      }
    }
  }

  get(x, y, w, h, cb) {
    for (let i = 0; i < this.o.length; i++) {
      cb(this.o[i]);
    }
    if (this.q != null) {
      this.quads(x, y, w, h, (quad) => {
        quad.get(x, y, w, h, cb);
      });
    }
  }

  clear() {
    this.o.length = 0;
    this.q = null;
  }
}
