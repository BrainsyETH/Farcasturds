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
              <strong>Spot a terrible take</strong> - Come across a post that's just plain wrong, cringe, or deserves to be called out?
            </p>
            <p className="fc-howto-step">
              <strong>Call in the turd</strong> - Reply to that post with <code className="fc-code">@farcasturd</code> (make sure to tag it correctly!)
            </p>
            <p className="fc-howto-step">
              <strong>Turd delivered!</strong> - The original poster automatically receives a turd NFT on their profile as a badge of shame
            </p>
            <p className="fc-howto-step">
              <strong>One requirement</strong> - You must own a Farcasturds NFT to send turds. No NFT = no turding privileges!
            </p>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1em', fontWeight: 'bold' }}>Pro tips:</h4>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  Turds are permanent and publicly visible on the recipient's profile
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Use your turds wisely - they're a limited resource based on your NFT holdings
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  The community can see who's sending turds, so your reputation is on the line too
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
