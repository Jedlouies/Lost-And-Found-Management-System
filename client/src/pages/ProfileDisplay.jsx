function ProfileDisplay({ personalInfo }) {
  if (!personalInfo) return null;

  if (personalInfo.isGuest) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        backgroundColor: '#E6F0FF', 
        padding: '10px', 
        borderRadius: '10px',
        border: '1px solid #99C2FF'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '30px',
          backgroundColor: '#3399FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          G
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0066CC' }}>
            Guest User
          </span>
          <span style={{ fontSize: '13px', color: '#666' }}>
            (Guest Profile)
          </span>
        </div>
      </div>
    );
  }

  // If registered user
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      backgroundColor: '#F0F0F0', 
      padding: '10px', 
      borderRadius: '10px'
    }}>
      <img 
        src={personalInfo.profileURL} 
        alt=""  
        style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '30px', 
          objectFit: 'cover' 
        }} 
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
          {personalInfo.firstName} {personalInfo.lastName}
        </span>
        <span style={{ fontSize: '15px' }}>
          {personalInfo.course?.abbr}
        </span>
      </div>
    </div>
  );
}
