/**
 * BhujanRakshak AI Telemetry & Landslide Prediction Engine
 * Computes geotechnical pore pressure, precipitation intensity, and probabilistic slope risk
 */

export function calculateSeverity(riskProbability) {
  if (riskProbability >= 75) return 'Critical';
  if (riskProbability >= 40) return 'Warning';
  return 'Safe';
}

export function generateDynamicAlerts(telemetry, isStormActive) {
  const alerts = [];

  if (isStormActive || telemetry.aiRiskProbability >= 75) {
    alerts.push({
      id: 'alert-storm-1',
      source: 'IMD Red Warning',
      time: 'Just now',
      message: `IMD Cloudburst Alert: ${telemetry.rainfallMm.toFixed(1)}mm continuous rain. Landslide risk surged by ${Math.round(telemetry.aiRiskProbability - 35)}%.`,
      level: 'Critical',
      zone: 'Meghalaya & South Assam'
    });
    alerts.push({
      id: 'alert-storm-2',
      source: 'Geological Survey of India (GSI)',
      time: '2m ago',
      message: `Pore-water pressure critical at 92.4 kPa along NH-6 Sonapur corridor. High susceptibility to translational debris slides.`,
      level: 'Critical',
      zone: 'NH-6 Highway Corridor'
    });
  } else if (telemetry.aiRiskProbability >= 40) {
    alerts.push({
      id: 'alert-warn-1',
      source: 'IMD Orange Advisory',
      time: '12m ago',
      message: `IMD Advisory: Moderate to heavy spells (${telemetry.rainfallMm.toFixed(1)}mm). Soil saturation elevated to ${telemetry.soilSaturation.toFixed(1)}%.`,
      level: 'Warning',
      zone: 'East Khasi Hills & Jaintia Hills'
    });
    alerts.push({
      id: 'alert-warn-2',
      source: 'Central Water Commission',
      time: '28m ago',
      message: 'Runoff velocity approaching safety margins near drainage culverts km 54-62.',
      level: 'Warning',
      zone: 'Barak Valley Foothills'
    });
  } else {
    alerts.push({
      id: 'alert-safe-1',
      source: 'IMD Routine Weather',
      time: '45m ago',
      message: `Normal monsoon activity. Intermittent drizzle (${telemetry.rainfallMm.toFixed(1)}mm). AI slope stability index stable at ${telemetry.aiRiskProbability.toFixed(1)}%.`,
      level: 'Safe',
      zone: 'Guwahati-Shillong Basin'
    });
  }

  return alerts;
}

export function generateEmergencyQueue(severity, isStormActive, highways) {
  if (isStormActive || severity === 'Critical') {
    return [
      {
        id: 'p-01',
        priority: 1,
        title: 'Immediate Evacuation: Sonapur & Lumshnong Downslope Settlements',
        desc: 'Issue emergency broadcast to 340 households under high-angle scree hazard.',
        agency: 'SDRF 1st Bn & District Disaster Mgmt Authority',
        status: 'Active Dispatch',
        timeReq: '< 15 mins'
      },
      {
        id: 'p-02',
        priority: 2,
        title: 'Highway Closure: Barricade NH-6 at km 48 and km 72',
        desc: 'Halt heavy vehicular traffic. Route ambulances through secondary Jowai bypass.',
        agency: 'State Highway Police & NHAI Quick Reaction Team',
        status: 'Enroute',
        timeReq: '< 25 mins'
      },
      {
        id: 'p-03',
        priority: 3,
        title: 'Pre-position Heavy Earthmovers at Ratacherra Tunnel Mouth',
        desc: 'Stage 3 hydraulic excavators and dumpers for rapid debris clearance.',
        agency: 'Border Roads Organisation (BRO) Task Force',
        status: 'Standby',
        timeReq: '45 mins'
      },
      {
        id: 'p-04',
        priority: 4,
        title: 'Activate Satellite Emergency Comms Unit in Champhai',
        desc: 'Prepare mobile VSAT backup in case optical fiber lines suffer slope breakage.',
        agency: 'BSNL Disaster Response Wing',
        status: 'Queued',
        timeReq: '60 mins'
      }
    ];
  }

  if (severity === 'Warning') {
    return [
      {
        id: 'p-02',
        priority: 1,
        title: 'Slope Inspection Patrol: Deploy Drone Recon on NH-6 km 34-45',
        desc: 'Scan tension cracks identified by crowdsourced citizen reports.',
        agency: 'PWD Geotechnical Cell & SDRF Drone Recon',
        status: 'In Progress',
        timeReq: '30 mins'
      },
      {
        id: 'p-03',
        priority: 2,
        title: 'Issue Restricted Speed Advisory (20 km/h) on NH-44',
        desc: 'Trigger electronic message boards at highway toll plazas.',
        agency: 'Traffic Police North East Command',
        status: 'Active',
        timeReq: 'Immediate'
      },
      {
        id: 'p-04',
        priority: 3,
        title: 'Clear Drainage Culverts on Aizawl Arterial Road',
        desc: 'Prevent ponding water from infiltrating sensitive colluvial soil mantle.',
        agency: 'Municipal Works Department',
        status: 'Queued',
        timeReq: '2 Hours'
      }
    ];
  }

  return [
    {
      id: 'p-05',
      priority: 1,
      title: 'Routine Geophone & Piezometer Calibration Check',
      desc: 'Verify telemetry sensor battery levels and LoRaWAN uplink health across all 8 hill stations.',
      agency: 'Regional Seismological & Geotech Centre',
      status: 'Normal Routine',
      timeReq: 'Daily Cycle'
    },
    {
      id: 'p-06',
      priority: 2,
      title: 'Maintain Standby Alert at Silchar Relief Depot',
      desc: 'Stockpile emergency rations and rescue kits in compliance with monsoon SOP.',
      agency: 'State Civil Supplies & Red Cross',
      status: 'Ready',
      timeReq: 'Standing'
    }
  ];
}
