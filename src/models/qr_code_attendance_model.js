const mongoose = require("mongoose");
const { Schema } = mongoose;

const QRCodeSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true, // unique token that will be encoded into QR
      // ❌ index: true — not needed, unique already creates index
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher", // or "User" if you use single model for all roles
      required: true,
      index: true,
    },

    // Optional: reference to a specific class/session (lecture)
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session", // create/adjust Session model as needed
    },

    // Optional human-readable meta
    title: { type: String }, // e.g. "BSCS-6 - 10:00AM"
    description: { type: String },

    // Expiration time (used for TTL index)
    expiresAt: {
      type: Date,
      required: true,
    },

    // Geo-fencing (optional)
    geo: {
      latitude: { type: Number },
      longitude: { type: Number },
      radiusMeters: { type: Number }, // allowed radius in meters
    },

    // Usage control
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    uses: { type: Number, default: 0 },

    // Whether QR is still active (teacher can deactivate early)
    isActive: { type: Boolean, default: true },

    // Optional: list of student ids who scanned
    scannedBy: [
      {
        student: { type: Schema.Types.ObjectId, ref: "Student" },
        scannedAt: { type: Date, default: Date.now },
        location: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ✅ TTL index: Mongo will automatically remove documents when expiresAt passes
QRCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ Keep only essential extra indexes
QRCodeSchema.index({ teacher: 1, isActive: 1 });

// ⚠️ Removed duplicate token index to fix warning

// =========================
// Instance Methods
// =========================

// check if QR code is still valid
QRCodeSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxUses > 0 && this.uses >= this.maxUses) return false;
  return true;
};

// ✅ check if student is within allowed geo-radius (Haversine formula)
QRCodeSchema.methods.isWithinAllowedRadius = function (studentLocation) {
  if (
    !this.geo?.latitude ||
    !this.geo?.longitude ||
    !this.geo?.radiusMeters ||
    !studentLocation
  )
    return true; // no restriction → allow

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // meters (Earth radius)
  const dLat = toRad(studentLocation.latitude - this.geo.latitude);
  const dLon = toRad(studentLocation.longitude - this.geo.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(this.geo.latitude)) *
      Math.cos(toRad(studentLocation.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= this.geo.radiusMeters;
};

// ✅ register a scan attempt
QRCodeSchema.methods.registerScan = async function (studentId, location) {
  if (!this.isValid()) throw new Error("QR not valid/expired/disabled");

  // prevent duplicate scan
  if (this.scannedBy.some((s) => s.student.toString() === studentId.toString())) {
    throw new Error("Already scanned by this student");
  }

  this.uses = (this.uses || 0) + 1;

  this.scannedBy.push({
    student: studentId,
    scannedAt: new Date(),
    location: location || undefined,
  });

  if (this.maxUses > 0 && this.uses >= this.maxUses) {
    this.isActive = false;
  }

  await this.save();
  return this;
};

module.exports = mongoose.model("QRCode", QRCodeSchema);
