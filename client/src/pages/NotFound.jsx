import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';

const NotFound = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="text-center shadow" style={{ maxWidth: '500px' }}>
        <Card.Body className="p-5">
          <h1 className="display-1 text-muted">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="mb-4">The page you are looking for doesn't exist or has been moved.</p>
          <Button as={Link} to="/" variant="primary">
            Go to Home
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default NotFound;