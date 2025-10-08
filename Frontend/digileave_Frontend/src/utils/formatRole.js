export function formatRole(role){
    switch(role){
      case "USER": role = "User" 
      break;
      case "APPROVER": role = "Approver"
      break;
      case "ADMIN": role = "Admin"
      break;
      default : role;
    }

    return role;
}