'use client';

import React from 'react';

export default function HowItWorks() {
  return (
    <div className="fc-howto-container">
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">How to Send Turds</h3>
          <div className="fc-howto">
            <p className="fc-howto-step">
              <strong>1.</strong> Come across a crap take?
            </p>
            <p className="fc-howto-step">
              <strong>2.</strong> Reply to it with <code className="fc-code">@farcasturd</code>
            </p>
            <p className="fc-howto-step">
              <strong>3.</strong> That's it! OP gets the turd 💩
            </p>
            <p className="fc-subtle" style={{ marginTop: '1rem' }}>
              <strong>:</strong> You can add any text - just include @farcasturd in your reply!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
