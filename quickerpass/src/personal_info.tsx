import { UseFormRegister } from 'react-hook-form';
import type { PersonalInfo } from './types';

type PersonalInfoProps = {
    register: UseFormRegister<PersonalInfo>;
}

export default function PersonalInfoForm({ register }: PersonalInfoProps) {
    return (
        <div className="section">
            <div className="section-title">📝 Personal Information</div>
            <div className="input-group">
                <label htmlFor="firstName">First Name</label>
                <input {...register('firstName')} type="text" id="firstName" placeholder="John" />
            </div>
            <div className="input-group">
                <label htmlFor="middleName">Middle Name</label>
                <input {...register('middleName')} type="text" id="middleName" placeholder="Robert" />
            </div>
            <div className="input-group">
                <label htmlFor="lastName">Last Name</label>
                <input {...register('lastName')} type="text" id="lastName" placeholder="Doe" />
            </div>
            <div className="input-group">
                <label htmlFor="suffix">Suffix</label>
                <input {...register('suffix')} type="text" id="suffix" placeholder="Jr., III, etc." />
            </div>
            <div className="input-group">
                <label htmlFor="gender">Gender</label>
                <select {...register('gender')} id="gender">
                    <option value="">Select...</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                </select>
            </div>
            <div className="input-group">
                <label htmlFor="birthdate">Date of Birth</label>
                <input {...register('birthdate')} type="date" id="birthdate" />
            </div>
        </div>
    )
}