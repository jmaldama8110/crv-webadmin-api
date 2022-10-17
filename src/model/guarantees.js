const mongoose = require("mongoose");

const guaranteeSchema = new mongoose.Schema({

  guarantee_type: { type: String, required: true },

  vehicle: {
      description: { type: String, required: false },
      color: { type: String, required: false },
      model: { type: String, required: false },
      origin: { type: String, required: false },
      motor_number: { type: String, required: false },
      chasis_number: { type: String, required: false },
      plate_number: { type: String, required: false },
      doors: { type: String, required: false },
      km: { type: String, required: false },
      general_condition: { type: String, required: false },
      years_remain: { type: String, required: false },

      fuel: { type: String, required: false },
      combustion: { type: String, required: false },
      reference: { type: String, required: false },
      motor_condition: { type: String, required: false },
      
      transmision: { type: String, required: false },
      velocities: { type: String, required: false },
      back_traction: { type: String, required: false },
      front_traction: { type: String, required: false },
      double_traction: { type: String, required: false },
      body_condition: { type: String, required: false },
      wheel_direction: { type: String, required: false },

      clutch: { type: String, required: false },
      suspention: { type: String, required: false },
      breaks: { type: String, required: false },
      locks: { type: String, required: false },
      tapestry: { type: String, required: false },
      wheels: { type: String, required: false },
      painting: { type: String, required: false },

      blue_book: {type:String, required: false},
      sale_value: {type:String, required: false},
      depreciation: [],
      photos: []
  },

  property: {
    description:{ type: String, required: false },
    ownership_name: { type: String, required: false},
    coords: {},
    street_name: { type: String, required: false },
    prop_location: { type: String, required: false },
    zone: { type: String, required: false },

    water_direct_take: { type: String, required: false },
    water_public_pool: { type: String, required: false },
    water_cistern: { type: String, required: false },
    water_other: { type: String, required: false },
    
    drain_public_grid: { type: String, required: false },
    drain_dripping: { type: String, required: false },
    drain_septic_tank: { type: String, required: false },
    
    road_access_dirt: { type: String, required: false },
    road_access_stone: { type: String, required: false },
    road_access_cobble: { type: String, required: false },
    road_access_concrete: { type: String, required: false },
    road_access_onfoot: { type: String, required: false }, // on foot
    road_access_car: { type: String, required: false }, // car

    edification_surface_size: { type: String, required: false },
    edification_toliet: { type: String, required: false },
    edification_garage: { type: String, required: false },
    edification_rooms: { type: String, required: false },
    edification_kitchen: { type: String, required: false },
    edification_dinning: { type: String, required: false },
    edification_living: { type: String, required: false },

    materials_foundations: { type: String, required: false },
    materials_roof: { type: String, required: false },
    materials_doors: { type: String, required: false },
    materials_finishes: { type: String, required: false },
    materials_walls: { type: String, required: false },
    materials_floor: { type: String, required: false },
    materials_windows: { type: String, required: false },
    materials_general_condition: { type: String, required: false },

    market_value: { type: String, required: false},
    proportional_value: { type: String, required: false},
    max_loan_amount: { type: String, required: false},
    metrics_m2_01: { type: String, required: false },
    metrics_up_01: { type: String, required: false },
    metrics_m2_02: { type: String, required: false },
    metrics_up_02: { type: String, required: false }, 
    comments: { type: String, required: false },
    photos:[]
  },
  // some comments
  equipment: {
    description:  { type: String, required: false},
    brand: { type: String, required: false},
    item_type: { type: String, required: false},
    serie: { type: String, required: false},
    year_purchase: { type: String, required: false},
    years_remain: { type: String, required: false},
    commercial_value: { type: String, required: false},
    new_used: { type: String, required: false},
    condition: { type: String, required: false},
    less_one_year: { type: String, required: false},
    photos: []
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  verificedAt: { type: Date, required: false },
}, { timestamps: true });

const Guarantee = mongoose.model("Guarantee", guaranteeSchema);
module.exports = Guarantee;
