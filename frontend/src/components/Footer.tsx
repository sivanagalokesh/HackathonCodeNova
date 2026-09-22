export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-mark" />Code<em>Nova</em>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem', maxWidth: '34ch', lineHeight: 1.6 }}>
              A premium tech marketplace engineered on a real concurrent
              order-processing core — every unit of stock is protected by
              row-level locking, never oversold.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="/products">All products</a>
            <a href="/deals">Deals</a>
            <a href="/#flash">Flash sale</a>
            <a href="/orders">Track order</a>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="/operations">Operations Center</a>
            <a href="/operations/test">Concurrency test</a>
            <a href="/operations/dlq">Dead-letter queue</a>
            <a href="/operations/events">Live event stream</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Engineering</a>
            <a href="#">Careers</a>
            <a href="#">Support</a>
          </div>
        </div>
        <div className="footer-bot">
          <span>© {new Date().getFullYear()} CodeNova. Built for the hackathon — original brand, real backend.</span>
          <span>Spring Boot · MySQL · WebSocket · React</span>
        </div>
      </div>
    </footer>
  );
}
