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
              <strong>Spot a crap take</strong> - Come across a post or content that deserves a turd?
            </p>
            <p className="fc-howto-step">
              <strong>Alert the turd</strong> - Reply to that post with <code className="fc-code">@farcasturd</code> (make sure to tag it correctly!)
            </p>
            <p className="fc-howto-step">
              <strong>Turd flung!</strong> - OP automatically receives a turd added to their Turd Score
            </p>
            <p className="fc-howto-step">
              <strong>Requirements</strong> - You must own a Farcasturds to send turds. No NFT = no poop privileges!
            </p>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1em', fontWeight: 'bold' }}>Pro tips:</h4>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  Turds are meant to be fun. Don't be a turd yourself. 
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Use your turds wisely - there are daily limits. 
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Your Turd Score is based on received Turds.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
