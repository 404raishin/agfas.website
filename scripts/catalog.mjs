/**
 * The catalogue seeded into WooCommerce. Edit freely — `seed-products.mjs`
 * matches on SKU, so re-running updates rather than duplicates.
 */

export const CATEGORIES = [
  {
    name: "Gas Leak Detectors",
    slug: "gas-leak-detectors",
    description:
      "Fixed and portable detectors for LPG and piped natural gas, alarming at 20% LEL.",
  },
  {
    name: "Fire Safety",
    slug: "fire-safety",
    description:
      "Extinguishers, blankets and suppression equipment for kitchens and worksites.",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Shut-off valves, mounting kits and replacement sensors.",
  },
];

const spec = (gas, threshold, sensor, power) => [
  { name: "Gas type", options: [gas], visible: true },
  { name: "Alarm threshold", options: [threshold], visible: true },
  { name: "Sensor life", options: [sensor], visible: true },
  { name: "Power", options: [power], visible: true },
];

export const PRODUCTS = [
  {
    sku: "AGF-G1",
    name: "AGFAS G1 Home Gas Leak Detector",
    regular_price: "189.00",
    category: "gas-leak-detectors",
    short_description:
      "<p>A plug-in LPG detector for kitchens with cylinder gas. Mounts near floor level where LPG collects, and sounds at 85 dB the moment concentration reaches 20% LEL.</p>",
    description: [
      "<p>The G1 is the detector we recommend for most Malaysian homes. It runs on mains power, samples continuously, and needs nothing from you beyond a monthly button test.</p>",
      "<h3>What it protects</h3>",
      "<ul><li>Kitchens using LPG cylinders</li><li>Homes with a single gas point</li><li>Rented units where a permanent install is not possible</li></ul>",
      "<h3>Placement</h3>",
      "<p>LPG is heavier than air, so mount the G1 no more than 30 cm above floor level and within 4 m of the cylinder. Do not place it directly above a stove — cooking fumes will trigger nuisance alarms.</p>",
      "<h3>In the box</h3>",
      "<ul><li>G1 detector unit</li><li>Wall mounting plate and screws</li><li>Quick start card (English / Bahasa Malaysia)</li></ul>",
    ].join("\n"),
    attributes: spec("LPG", "20% LEL", "5 years", "240V mains"),
    stock: 40,
  },
  {
    sku: "AGF-G2",
    name: "AGFAS G2 Pro Detector with Auto Shut-off Valve",
    regular_price: "549.00",
    sale_price: "489.00",
    category: "gas-leak-detectors",
    short_description:
      "<p>Detector and motorised shut-off valve as one system. On alarm it does not just warn — it closes the gas line automatically.</p>",
    description: [
      "<p>The G2 Pro pairs the G1 sensor platform with a DN20 solenoid valve. When the sensor crosses 20% LEL, the valve drives shut within two seconds and stays shut until manually reset.</p>",
      "<h3>Why the valve matters</h3>",
      "<p>An alarm only helps if someone is home to hear it. The G2 Pro is specified for houses left empty during the day, and for restaurant kitchens where a leak may start after closing.</p>",
      "<h3>Installation</h3>",
      "<p>The valve fits inline on the regulator outlet. We recommend installation by a registered gas fitter; we can arrange this in Klang Valley.</p>",
    ].join("\n"),
    attributes: spec(
      "LPG / Natural gas",
      "20% LEL",
      "5 years",
      "240V mains + 12V valve",
    ),
    stock: 18,
  },
  {
    sku: "AGF-K5",
    name: "AGFAS K5 Kitchen Alarm — Natural Gas",
    regular_price: "229.00",
    category: "gas-leak-detectors",
    short_description:
      "<p>Ceiling-mounted detector tuned for piped natural gas (methane), which rises rather than pools.</p>",
    description: [
      "<p>Piped natural gas behaves the opposite way to LPG: it is lighter than air and gathers at ceiling level. A floor-mounted LPG detector will not see it in time.</p>",
      "<h3>Placement</h3>",
      "<p>Mount the K5 within 30 cm of the ceiling and within 4 m of the appliance. Keep it clear of extractor hoods and windows, which pull gas away from the sensor.</p>",
    ].join("\n"),
    attributes: spec("Natural gas (CH4)", "20% LEL", "5 years", "240V mains"),
    stock: 25,
  },
  {
    sku: "AGF-P4",
    name: "AGFAS 4-Zone Gas Detection Panel",
    regular_price: "1890.00",
    category: "gas-leak-detectors",
    short_description:
      "<p>Wall-mounted control panel supervising up to four remote sensor heads, with relay outputs for valves, sirens and building management.</p>",
    description: [
      "<p>For commercial kitchens, plant rooms and light industrial sites that need more than one detection point on a single supervised system.</p>",
      "<h3>Capability</h3>",
      "<ul><li>Four independently addressed sensor heads</li><li>Per-zone alarm and fault indication</li><li>Volt-free relay outputs for shut-off valves and external sirens</li><li>Battery backup for 8 hours</li></ul>",
      "<p>Sensor heads are ordered separately so each zone can be specified for the gas actually present.</p>",
    ].join("\n"),
    attributes: spec(
      "LPG / Natural gas / CO",
      "Configurable, 10-40% LEL",
      "5 years per head",
      "240V mains + battery backup",
    ),
    stock: 6,
  },
  {
    sku: "AGF-S3",
    name: "AGFAS Portable Gas Leak Sniffer",
    regular_price: "269.00",
    category: "gas-leak-detectors",
    short_description:
      "<p>A handheld probe for tracing a leak to the exact joint. Gooseneck sensor, audible tick rate that rises with concentration.</p>",
    description: [
      "<p>Fixed detectors tell you there is a leak. The S3 tells you where it is. The flexible probe reaches behind appliances and along pipe runs, and the tick rate accelerates as you approach the source.</p>",
      "<h3>Typical use</h3>",
      "<ul><li>Commissioning a new gas installation</li><li>Tracing a leak after a fixed detector has alarmed</li><li>Routine joint inspection</li></ul>",
    ].join("\n"),
    attributes: spec(
      "LPG / Natural gas",
      "Sensitivity from 50 ppm",
      "3 years",
      "Rechargeable Li-ion",
    ),
    stock: 22,
  },
  {
    sku: "AGF-V20",
    name: "AGFAS Solenoid Shut-off Valve DN20",
    regular_price: "320.00",
    category: "accessories",
    short_description:
      "<p>Normally-open brass solenoid valve that closes the gas line on a detector alarm signal. Manual reset.</p>",
    description: [
      "<p>The same valve fitted to the G2 Pro, available separately to retrofit an existing AGFAS detector or a third-party panel with a volt-free output.</p>",
      "<p>Manual reset is deliberate: the line must not reopen by itself once a leak has been detected.</p>",
    ].join("\n"),
    attributes: [
      { name: "Connection", options: ["DN20 (3/4 inch)"], visible: true },
      { name: "Body", options: ["Brass"], visible: true },
      { name: "Operation", options: ["Normally open, manual reset"], visible: true },
      { name: "Power", options: ["12V DC"], visible: true },
    ],
    stock: 30,
  },
  {
    sku: "AGF-FE2",
    name: "ABC Dry Powder Fire Extinguisher 2kg",
    regular_price: "129.00",
    category: "fire-safety",
    short_description:
      "<p>Multi-purpose 2 kg extinguisher rated for solids, liquids and gas fires. Sized for a domestic kitchen or a car.</p>",
    description: [
      "<p>ABC dry powder handles the three fire classes most likely in a home or small business, including gas fires — which many water and foam extinguishers cannot.</p>",
      "<h3>Servicing</h3>",
      "<p>Check the gauge monthly; the needle must sit in the green. Have the unit serviced annually and replaced at 5 years.</p>",
    ].join("\n"),
    attributes: [
      { name: "Rating", options: ["ABC"], visible: true },
      { name: "Capacity", options: ["2 kg"], visible: true },
      { name: "Service interval", options: ["12 months"], visible: true },
    ],
    stock: 50,
  },
  {
    sku: "AGF-FB12",
    name: "Fire Blanket 1.2m x 1.2m",
    regular_price: "69.00",
    category: "fire-safety",
    short_description:
      "<p>Fibreglass blanket in a quick-pull pouch. The correct first response to a pan fire — never water.</p>",
    description: [
      "<p>Mount the pouch beside the kitchen exit, not beside the stove: you want to be able to reach it while moving away from a fire, not towards one.</p>",
      "<h3>Use</h3>",
      "<p>Pull both tabs, hold the blanket with your hands shielded behind it, and lay it over the pan. Turn off the gas and leave it covered for at least 30 minutes.</p>",
    ].join("\n"),
    attributes: [
      { name: "Material", options: ["Fibreglass"], visible: true },
      { name: "Size", options: ["1.2 m x 1.2 m"], visible: true },
    ],
    stock: 60,
  },
];
