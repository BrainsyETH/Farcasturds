'use client';

import React from 'react';

export default function HowItWorks() {
  return (
    <div className="fc-howto-container">
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">How to Send Turds</h3>
          <div className="fc-howto">
            <p className="fc-howto-step" style={{ textAlign: 'center' }}>
              <strong>1.</strong> Come across a crap take?
            </p>
            <p className="fc-howto-step" style={{ textAlign: 'center' }}>
              <strong>2.</strong> Reply to it with <code className="fc-code">@farcasturd</code>
            </p>
            <p className="fc-howto-step" style={{ textAlign: 'center' }}>
              <strong>3.</strong> That's it! OP gets the turd <img src="/splash.png" alt="turd" style={{ display: 'inline', width: '1.2em', height: '1.2em', verticalAlign: 'middle' }} />
            </p>
            <p className="fc-subtle" style={{ marginTop: '1rem' }}>
              <strong>Note:</strong> You must have a Farcasturds NFT to participate!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
