import { PersonalInfo, Answers } from "./types";
import dayjs from 'dayjs';
import QRCode from 'react-qr-code';

type BarcodeProps = {
    personalInfo: PersonalInfo;
    answers: Answers;
}

export default function Barcode({ personalInfo, answers }: BarcodeProps) {
    const birthdateString = personalInfo.birthdate?.replace(/-/g, '');
    const timestamp = dayjs().format('YYYYMMDDHHmmss');

    const answersString = Object.entries(answers).map(([key, value]) => `${key}:${value}`).join(',');
    const quickpassCompatibleArray = [
        '1.0',
        'W1416',
        '',
        '',
        personalInfo.lastName,
        personalInfo.firstName,
        personalInfo.middleName,
        personalInfo.suffix,
        personalInfo.gender,
        birthdateString,
        `${timestamp}|WEB1<${answersString}>`
    ]
    return (
        <div className="section">
            <div className="section-title">📊 Generated Barcode</div>
            <QRCode className="barcode-image" value={JSON.stringify(quickpassCompatibleArray)} />
        </div>
    );
}